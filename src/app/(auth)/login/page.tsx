import Link from "next/link";
import { LoginGoogle } from "@/components/login-google";
const oauthErrors: Record<string,string> = {
 missing_code:"Google sign-in did not complete.", oauth_exchange_failed:"Sign-in failed. Try again.",
 session_failed:"Session could not be started.", profile_load_failed:"Could not load your profile.",
 account_restricted:"Account restricted."
};
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string|string[]}>}) {
 const params=await searchParams;
 const raw=Array.isArray(params.error)?params.error[0]:params.error;
 const message=raw?(oauthErrors[raw]??"Sign-in failed. Try again."):null;
 return <main className="flex min-h-dvh items-center justify-center bg-[#09090b] px-5 py-12 text-[#f5f5f7]">
   <div className="w-full max-w-[360px]">
     <div className="mb-16 text-center text-3xl font-semibold tracking-[-.065em]">extrovert<span className="text-[#e7467e]">.</span></div>
     <h1 className="text-center text-[29px] font-semibold tracking-[-.05em]">Welcome to Extrovert</h1>
     <p className="mb-9 mt-2 text-center text-sm text-zinc-400">Your people. Your world.</p>
     <LoginGoogle/>
     {message?<p role="alert" className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{message}</p>:null}
     <div className="mt-9 flex justify-center gap-5 text-xs text-zinc-500"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/safety">Safety</Link></div>
   </div>
 </main>;
}
