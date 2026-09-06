"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";

const nav=[
 {href:routes.discover,label:"Discover"},
 {href:routes.explore,label:"Explore"},
 {href:routes.likes,label:"Likes"},
 {href:routes.messages,label:"Chat"},
 {href:routes.profile,label:"Profile"},
 {href:routes.settings,label:"Settings"},
];

export function AppNavbar({userEmail,isSuperAdmin}:{userEmail:string;isSuperAdmin:boolean}){const pathname=usePathname();return <header className="hidden shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md md:block"><div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6"><Link href={routes.discover} prefetch className="shrink-0"><BrandLogo/></Link><nav className="flex min-w-0 flex-1 items-center gap-1">{nav.map(({href,label})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} prefetch className={`rounded-xl px-3 py-2 text-sm font-bold ${active?"text-emerald-600":"text-zinc-600 hover:bg-zinc-50"}`}>{label}</Link>})}</nav>{isSuperAdmin&&<Link href={routes.admin.root} prefetch className="rounded-xl px-3 py-2 text-sm font-bold text-rose-600">Admin</Link>}<span className="max-w-44 truncate text-xs text-zinc-400">{userEmail}</span></div></header>}
