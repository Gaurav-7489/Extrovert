"use client";
import Link from "next/link";
import { Bell, Settings, Plus, Shield } from "lucide-react";
export function AppNavbar({ userEmail, isSuperAdmin }: {userEmail:string;isSuperAdmin:boolean}) {
  void userEmail;
  return <header className="z-40 shrink-0 border-b border-white/10 bg-[#101013]/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
    <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3">
      <Link href="/app/feed" className="text-lg font-semibold tracking-[-.045em]">extrovert<span className="text-[#e7467e]">.</span></Link>
      <div className="flex items-center gap-1">
        <Link href="/app/feed?compose=1" aria-label="New post" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><Plus size={20}/></Link>
        <Link href="/app/messages" aria-label="Messages" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><Bell size={18}/></Link>
        <Link href="/app/settings" aria-label="Settings" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><Settings size={18}/></Link>
        {isSuperAdmin?<Link href="/admin" aria-label="Admin" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><Shield size={18}/></Link>:null}
      </div>
    </div>
  </header>;
}
