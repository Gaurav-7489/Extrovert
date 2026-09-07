"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, UserRound, Sparkles } from "lucide-react";
import { routes } from "@/config/routes";

const items=[{href:routes.discover,label:"Discover",Icon:Compass},{href:routes.explore,label:"Explore",Icon:Sparkles},{href:routes.likes,label:"Likes",Icon:Heart},{href:routes.messages,label:"Chat",Icon:MessageCircle},{href:routes.profile,label:"Profile",Icon:UserRound}];

export function DatingBottomNav(){const pathname=usePathname();return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-zinc-800 dark:bg-[#0a0a0a]/95"><div className="mx-auto flex h-[68px] w-full max-w-[420px] items-center justify-around px-1">{items.map(({href,label,Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} prefetch className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[9px] font-bold transition ${active?"text-red-600":"text-zinc-500"}`}><Icon className="h-5 w-5" strokeWidth={active?2.5:2}/><span>{label}</span></Link>})}</div></nav>}
