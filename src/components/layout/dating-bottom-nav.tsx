"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, UserRound, Sparkles } from "lucide-react";
import { routes } from "@/config/routes";

const items=[{href:routes.discover,label:"Discover",Icon:Compass},{href:routes.explore,label:"Explore",Icon:Sparkles},{href:routes.likes,label:"Likes",Icon:Heart},{href:routes.messages,label:"Chat",Icon:MessageCircle},{href:routes.profile,label:"Profile",Icon:UserRound}];
export function DatingBottomNav(){const pathname=usePathname();return <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgb(var(--border-subtle)/.9)] bg-[rgb(var(--background)/.94)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"><div className="mx-auto flex h-[72px] w-full max-w-[430px] items-center justify-around px-2">{items.map(({href,label,Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} prefetch aria-current={active?"page":undefined} className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-transform duration-150 active:scale-[.96] ${active?"text-[rgb(var(--text-primary))]":"text-[rgb(var(--text-muted))]"}`}><span className={`flex h-9 w-12 items-center justify-center rounded-xl transition-[background-color,transform] duration-150 ${active?"bg-[rgb(var(--brand-soft))]":"bg-transparent group-hover:bg-[rgb(var(--bg-elevated))]"}`}><Icon className="h-5 w-5" strokeWidth={active?2.4:1.9}/></span><span className={`text-[10px] tracking-tight ${active?"font-bold text-[rgb(var(--brand))]":"font-medium"}`}>{label}</span></Link>})}</div></nav>}
