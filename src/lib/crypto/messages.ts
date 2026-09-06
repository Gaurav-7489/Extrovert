import type { SupabaseClient } from "@supabase/supabase-js";

const KEY_PREFIX = "datelocal:e2ee:v1:";
const ALGORITHM = "ECDH-P256-AES-256-GCM";
type StoredKey = { privateKey: JsonWebKey; publicKey: JsonWebKey };

function bytesToBase64(bytes: Uint8Array){let binary="";const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary);}
function base64ToBytes(value:string){const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return bytes;}
async function generateStoredKey():Promise<StoredKey>{const pair=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveKey"]) as CryptoKeyPair;const [privateKey,publicKey]=await Promise.all([crypto.subtle.exportKey("jwk",pair.privateKey),crypto.subtle.exportKey("jwk",pair.publicKey)]);return{privateKey,publicKey};}

export async function ensureOwnMessageKey(supabase:SupabaseClient,userId:string):Promise<JsonWebKey>{
 if(typeof window==="undefined"||!crypto?.subtle)throw new Error("Secure messaging requires a modern HTTPS browser.");
 const storageKey=`${KEY_PREFIX}${userId}`;let stored:StoredKey|null=null;
 try{const raw=window.localStorage.getItem(storageKey);if(raw)stored=JSON.parse(raw) as StoredKey;}catch{stored=null;}
 if(!stored?.privateKey||!stored.publicKey){stored=await generateStoredKey();window.localStorage.setItem(storageKey,JSON.stringify(stored));}
 // The private key lives on this device, so the public key in Supabase must always
 // correspond to it. Upserting here repairs stale/mismatched registrations after
 // a browser reset, deployment, or an earlier key-registration implementation.
 const {error}=await supabase.from("message_keys").upsert({user_id:userId,public_key:JSON.stringify(stored.publicKey),algorithm:ALGORITHM,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error)throw new Error("Could not register this device for secure messaging.");
 return stored.publicKey;
}

async function getPrivateKey(userId:string){const raw=window.localStorage.getItem(`${KEY_PREFIX}${userId}`);if(!raw)throw new Error("Secure messaging key is missing on this device.");const stored=JSON.parse(raw) as StoredKey;return crypto.subtle.importKey("jwk",stored.privateKey,{name:"ECDH",namedCurve:"P-256"},false,["deriveKey"]);}
async function getRemotePublicKey(supabase:SupabaseClient,userId:string){const {data,error}=await supabase.from("message_keys").select("public_key").eq("user_id",userId).maybeSingle();if(error||!data?.public_key)throw new Error("Secure messaging is not ready for this match yet.");const jwk=typeof data.public_key==="string"?JSON.parse(data.public_key) as JsonWebKey:data.public_key as JsonWebKey;return crypto.subtle.importKey("jwk",jwk,{name:"ECDH",namedCurve:"P-256"},false,[]);}
async function deriveConversationKey(supabase:SupabaseClient,currentUserId:string,otherUserId:string){const privateKey=await getPrivateKey(currentUserId);const remotePublicKey=await getRemotePublicKey(supabase,otherUserId);return crypto.subtle.deriveKey({name:"ECDH",public:remotePublicKey},privateKey,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);}
export async function encryptMessage(supabase:SupabaseClient,currentUserId:string,otherUserId:string,matchId:string,plaintext:string){const key=await deriveConversationKey(supabase,currentUserId,otherUserId);const iv=crypto.getRandomValues(new Uint8Array(12));const aad=new TextEncoder().encode(`DateLocal:E2EE:v1:${matchId}`);const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:aad,tagLength:128},key,new TextEncoder().encode(plaintext));return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;}
export async function decryptMessage(supabase:SupabaseClient,currentUserId:string,otherUserId:string,matchId:string,payload:string){if(!payload.startsWith("v1."))throw new Error("Unsupported encrypted message format.");const [,iv64,ciphertext64]=payload.split(".");if(!iv64||!ciphertext64)throw new Error("Invalid encrypted message.");const key=await deriveConversationKey(supabase,currentUserId,otherUserId);const plaintext=await crypto.subtle.decrypt({name:"AES-GCM",iv:base64ToBytes(iv64),additionalData:new TextEncoder().encode(`DateLocal:E2EE:v1:${matchId}`),tagLength:128},key,base64ToBytes(ciphertext64));return new TextDecoder().decode(plaintext);}
export const MESSAGE_ENCRYPTION_LABEL="End-to-end encrypted";
