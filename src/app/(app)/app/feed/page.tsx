"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MapPin, Plus, Video, Phone, Send, X } from "lucide-react";
type Post = { id:number; body:string; created:number; liked:boolean };
export default function Feed() {
 const [posts,setPosts]=useState<Post[]>([]);
 const [draft,setDraft]=useState("");
 const [compose,setCompose]=useState(false);
 const [location,setLocation]=useState<string|null>(null);
 const [locationError,setLocationError]=useState("");
 useEffect(()=>{setCompose(new URLSearchParams(window.location.search).has("compose"));try{const raw=sessionStorage.getItem("extrovert-demo-posts");if(raw)setPosts(JSON.parse(raw));}catch{}},[]);
 function save(next:Post[]){setPosts(next);try{sessionStorage.setItem("extrovert-demo-posts",JSON.stringify(next));}catch{}}
 function publish(){const text=draft.trim();if(!text||text.length>1000)return;save([{id:Date.now(),body:text,created:Date.now(),liked:false},...posts]);setDraft("");setCompose(false)}
 function locate(){setLocationError("");if(!navigator.geolocation){setLocationError("Location is unavailable.");return;}navigator.geolocation.getCurrentPosition(p=>setLocation(p.coords.latitude.toFixed(2)+", "+p.coords.longitude.toFixed(2)),()=>setLocationError("Location permission was not granted."),{enableHighAccuracy:false,timeout:10000,maximumAge:60000});}
 return <div className="mx-auto w-full max-w-[650px] px-4 pb-8 pt-6 text-[#f5f5f7]">
   <div className="mb-6 flex items-center justify-between"><h1 className="text-[22px] font-semibold tracking-tight">Home</h1><button onClick={()=>setCompose(true)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950"><Plus size={16}/>Post</button></div>
   <div className="mb-6 grid grid-cols-4 gap-2">
    {[{icon:Video,label:"Reels",href:"/app/reels"},{icon:MapPin,label:"Nearby",href:"/app/discover"},{icon:Phone,label:"Calls",href:"/app/calls"},{icon:MessageCircle,label:"Chats",href:"/app/messages"}].map(({icon:Icon,label,href})=><Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#19191d] px-1 py-4 text-xs text-zinc-300 hover:border-white/25"><Icon size={20}/>{label}</Link>)}
   </div>
   <section className="mb-6 rounded-2xl border border-white/10 bg-[#19191d] p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-medium">Around you</h2><p className="mt-1 text-xs text-zinc-500">{location?location:"Location off"}</p></div><button onClick={location?()=>setLocation(null):locate} className="rounded-full border border-white/20 px-3 py-2 text-xs">{location?"Clear":"Enable"}</button></div>{locationError?<p role="status" className="mt-2 text-xs text-rose-300">{locationError}</p>:null}<p className="mt-3 text-xs text-zinc-500">Location remains on this screen and is not posted.</p></section>
   {compose?<section className="mb-6 rounded-2xl border border-white/15 bg-[#202024] p-4"><div className="mb-3 flex justify-between"><h2 className="font-medium">New post</h2><button aria-label="Close composer" onClick={()=>setCompose(false)}><X size={18}/></button></div><textarea autoFocus value={draft} maxLength={1000} onChange={e=>setDraft(e.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-[#111114] p-3 text-sm outline-none" placeholder="What's happening?"/><div className="mt-3 flex items-center justify-between"><span className="text-xs text-zinc-500">{draft.length}/1000 · Session preview</span><button disabled={!draft.trim()} onClick={publish} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"><Send size={15}/>Publish</button></div></section>:null}
   <p className="mb-3 text-xs text-zinc-500">Feed preview · Posts remain on this device tab session until closed.</p>
   {posts.length===0?<div className="rounded-2xl border border-white/10 bg-[#19191d] px-6 py-14 text-center"><p className="text-base font-medium">Your feed starts here.</p><p className="mt-2 text-sm text-zinc-400">Share a thought or explore people nearby.</p><button className="mt-5 rounded-full border border-white/20 px-4 py-2 text-sm" onClick={()=>setCompose(true)}>Create post</button></div>:posts.map(post=><article key={post.id} className="mb-3 rounded-2xl border border-white/10 bg-[#19191d] p-4"><div className="mb-3 flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-zinc-700 text-sm">Y</div><div><p className="text-sm font-medium">You</p><p className="text-xs text-zinc-500">Just now</p></div></div><p className="whitespace-pre-wrap break-words text-sm leading-6">{post.body}</p><div className="mt-5 flex gap-5 text-zinc-400"><button aria-label={post.liked?"Unlike":"Like"} onClick={()=>save(posts.map(x=>x.id===post.id?{...x,liked:!x.liked}:x))} className={post.liked?"text-rose-400":""}><Heart size={18} fill={post.liked?"currentColor":"none"}/></button><Link href="/app/messages" aria-label="Messages"><MessageCircle size={18}/></Link></div></article>)}
 </div>;
}
