import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

const inter=Inter({subsets:["latin"],variable:"--font-sans",display:"swap",preload:true});
export const viewport:Viewport={themeColor:"#e50914",width:"device-width",initialScale:1,maximumScale:1,userScalable:false,viewportFit:"cover"};
export const metadata:Metadata={title:"Extrovert — Dating, reimagined",description:"Discover people, make a connection and start a conversation with Extrovert.",alternates:{canonical:"/"},manifest:"/manifest.json",icons:{icon:[{url:"/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icon-512.png",sizes:"512x512",type:"image/png"}],apple:"/icon-192.png"},appleWebApp:{capable:true,title:"Extrovert",statusBarStyle:"black-translucent"}};

const themeScript=`(()=>{try{const t=localStorage.getItem('extrovert-theme');if(t==='dark'||(t===null&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch{}})()`;

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning className={inter.variable}><head><script dangerouslySetInnerHTML={{__html:themeScript}}/><link rel="icon" href="/icon-192.png"/><link rel="apple-touch-icon" href="/icon-192.png"/></head><body className="min-h-[100dvh] overflow-x-hidden bg-black font-sans text-zinc-900 antialiased selection:bg-[#e50914] selection:text-white"><div className="flex min-h-[100dvh] w-full items-start justify-center bg-black p-0 sm:p-6"><div className="relative flex min-h-[100dvh] w-full max-w-[420px] flex-col overflow-x-hidden bg-white shadow-[0_25px_60px_rgba(229,9,20,.12)] sm:min-h-[840px] sm:rounded-[40px] sm:border-[8px] sm:border-white dark:bg-[#0a0a0a] dark:sm:border-[#171717]">{children}</div></div></body></html>}
