"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)&&!("MSStream"in window)}
function isStandalone(){return window.matchMedia("(display-mode:standalone)").matches||((navigator as Navigator&{standalone?:boolean}).standalone===true)}
export function AppInstallPrompt(){
 const [event,setEvent]=useState<InstallEvent|null>(null);const [ios,setIos]=useState(false);const [busy,setBusy]=useState(false);const [hidden,setHidden]=useState(false);
 useEffect(()=>{if(isStandalone())return;setIos(isIOS());const onPrompt=(e:Event)=>{e.preventDefault();setEvent(e as InstallEvent)};window.addEventListener("beforeinstallprompt",onPrompt);return()=>window.removeEventListener("beforeinstallprompt",onPrompt)},[]);
 if(hidden||(!event&&!ios))return null;
 const dismiss=()=>setHidden(true);
 const install=async()=>{if(!event)return;setBusy(true);try{await event.prompt();await event.userChoice;setEvent(null)}catch{}finally{setBusy(false)}};
 return <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[100000] mx-auto max-w-sm"><div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Download className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="text-sm font-black text-zinc-950">Get the Extrovert app</p>{ios?<p className="mt-1 text-[11px] leading-4 text-zinc-600">On iPhone, tap <Share className="mx-0.5 inline h-3 w-3"/> <b>Share</b>, then choose <b>Add to Home Screen</b>.</p>:<p className="mt-1 text-[11px] text-zinc-500">Install it for a faster, app-like experience.</p>}</div><button type="button" onClick={dismiss} aria-label="Not now" className="rounded-full p-1.5 text-zinc-400"><X className="h-4 w-4"/></button></div>{event&&<div className="mt-3 flex gap-2"><button type="button" onClick={()=>void install()} disabled={busy} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white disabled:opacity-60">{busy?"Installing…":"Install app"}</button><button type="button" onClick={dismiss} className="rounded-2xl border border-zinc-200 px-4 py-3 text-xs font-bold text-zinc-600">Not now</button></div>}</div></div>;
}
