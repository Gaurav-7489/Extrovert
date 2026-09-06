"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { loadOlderMessages, sendMessage } from "../actions";
import { blockUser, reportUser } from "../../discover/actions";
import { routes } from "@/config/routes";
import { decryptMessage, encryptMessage, ensureOwnMessageKey, MESSAGE_ENCRYPTION_LABEL } from "@/lib/crypto/messages";
import { Send, MoreVertical, Flag, UserX, X, Loader2, AlertCircle, Sparkles, MapPin, Coffee, ChevronLeft, LockKeyhole, ShieldCheck, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = { id:string; sender_id:string; content:string|null; ciphertext:string|null; encryption_version:number; created_at:string };
type ProfileData = { id:string; display_name:string|null; department:string|null; academic_year:string|null; relationship_goal?:string|null; campus_residency?:string|null; campus_hangout?:string|null; zodiac?:string|null; prompt_question?:string|null; prompt_answer?:string|null; verification_status?:string|null };
type Props = { matchId:string; currentUserId:string; otherUserId:string; otherProfile:ProfileData; otherPhotoUrl:string|null; initialMessages:Message[] };
const MAX_MESSAGE_LENGTH = 2000;
function formatMessageTime(iso:string) { return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }
function triggerHaptic(pattern:number[]=[15]) { if (typeof window !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(pattern); } catch {} } }

export default function ChatClient({ matchId, currentUserId, otherUserId, otherProfile, otherPhotoUrl, initialMessages }:Props) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialScrollRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const previousLengthRef = useRef(initialMessages.length);
  const [messages,setMessages] = useState<Message[]>(() => { const seen = new Set<string>(); return initialMessages.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }); });
  const [hasMore,setHasMore] = useState(initialMessages.length >= 40);
  const [content,setContent] = useState("");
  const [loading,setLoading] = useState(false);
  const [loadingOlder,setLoadingOlder] = useState(false);
  const [error,setError] = useState("");
  const [secureReady,setSecureReady] = useState(false);
  const [keyboardOffset,setKeyboardOffset] = useState(0);
  const [menuOpen,setMenuOpen] = useState(false);
  const [reportModalOpen,setReportModalOpen] = useState(false);
  const [reportReason,setReportReason] = useState("Inappropriate behavior");
  const [reportDetails,setReportDetails] = useState("");
  const [reportSubmitting,setReportSubmitting] = useState(false);
  const [,startTransition] = useTransition();
  const firstName = otherProfile.display_name?.split(" ")[0] || "Match";
  const icebreakers = ["Canteen chai after lecture?", "How is the semester treating you so far?", otherProfile.campus_hangout ? `Catch up at ${otherProfile.campus_hangout}?` : "What is your favorite spot on campus?", "Studying or chilling today?"];

  useEffect(() => { let alive = true; const supabase = supabaseRef.current; (async () => { try { await ensureOwnMessageKey(supabase,currentUserId); if (alive) setSecureReady(true); } catch { if (alive) setError("Secure messaging could not initialize on this device."); } })(); return () => { alive = false; }; },[currentUserId]);

  useEffect(() => {
    if (!secureReady) return;
    let alive = true;
    const supabase = supabaseRef.current;
    (async () => {
      const next = await Promise.all(initialMessages.map(async m => {
        if (m.content || !m.ciphertext || m.encryption_version !== 1) return m;
        try { return { ...m, content: await decryptMessage(supabase,currentUserId,otherUserId,matchId,m.ciphertext) }; }
        catch { return { ...m, content:"Unable to decrypt this message on this device." }; }
      }));
      if (alive) setMessages(next);
    })();
    const channel = supabase.channel(`chat_${matchId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`match_id=eq.${matchId}`},async payload => {
        const incoming = payload.new as Message;
        if (incoming.sender_id === currentUserId) return;
        let hydrated:Message = { ...incoming, content:"Unable to decrypt this message on this device." };
        if (incoming.ciphertext && incoming.encryption_version === 1) {
          try { hydrated = { ...incoming, content:await decryptMessage(supabase,currentUserId,otherUserId,matchId,incoming.ciphertext) }; } catch {}
        }
        setMessages(prev => prev.some(m => m.id === incoming.id) ? prev : [...prev,hydrated]);
      });
    void channel.subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  },[secureReady,matchId,currentUserId,otherUserId,initialMessages]);

  useEffect(() => {
    if (initialScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior:"auto", block:"end" });
      initialScrollRef.current = false;
      previousLengthRef.current = messages.length;
      return;
    }
    if (loadingOlderRef.current) return;
    if (messages.length > previousLengthRef.current) bottomRef.current?.scrollIntoView({ behavior:"smooth", block:"end" });
    previousLengthRef.current = messages.length;
  },[messages.length]);

  const loadOlder = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingOlderRef.current || messages.length === 0) return;
    const before = messages[0]?.created_at;
    if (!before) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setError("");
    const oldHeight = el.scrollHeight;
    const oldTop = el.scrollTop;
    try {
      const result = await loadOlderMessages(matchId,before);
      if (result.error) { setError(result.error); return; }
      if (!result.messages.length) { setHasMore(false); return; }
      const decrypted = await Promise.all(result.messages.map(async m => {
        if (m.content || !m.ciphertext || m.encryption_version !== 1) return m as Message;
        try { return { ...m, content:await decryptMessage(supabaseRef.current,currentUserId,otherUserId,matchId,m.ciphertext) } as Message; }
        catch { return { ...m, content:"Unable to decrypt this message on this device." } as Message; }
      }));
      setMessages(prev => {
        const existing = new Set(prev.map(m=>m.id));
        return [...decrypted.filter(m=>!existing.has(m.id)),...prev];
      });
      setHasMore(result.hasMore);
      requestAnimationFrame(() => { const nextHeight = el.scrollHeight; el.scrollTop = oldTop + (nextHeight-oldHeight); });
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  },[hasMore,matchId,messages,currentUserId,otherUserId]);

  function handleScroll(e:React.UIEvent<HTMLDivElement>) { if (e.currentTarget.scrollTop < 100) void loadOlder(); }

  useEffect(() => { if (typeof window === "undefined" || !window.visualViewport) return; const viewport = window.visualViewport; let raf = 0; const update = () => { if (raf) return; raf = window.requestAnimationFrame(() => { raf = 0; setKeyboardOffset(Math.max(0,Math.round(window.innerHeight - viewport.height - viewport.offsetTop))); }); }; update(); viewport.addEventListener("resize",update); viewport.addEventListener("scroll",update); window.addEventListener("resize",update); return () => { viewport.removeEventListener("resize",update); viewport.removeEventListener("scroll",update); window.removeEventListener("resize",update); if (raf) window.cancelAnimationFrame(raf); }; },[]);
  useEffect(() => { if (!inputRef.current) return; const el = inputRef.current; const onFocus = () => window.setTimeout(() => el.scrollIntoView({ block:"center", behavior:"smooth" }),120); el.addEventListener("focus",onFocus); return () => el.removeEventListener("focus",onFocus); },[]);

  async function handleSend(e?:React.FormEvent<HTMLFormElement>) { e?.preventDefault(); const text = content.trim(); if (!text || loading) return; if (text.length > MAX_MESSAGE_LENGTH) { setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`); return; } if (!secureReady) { setError("Secure messaging is still starting. Please try again in a moment."); return; } setLoading(true); setError(""); try { const encrypted = await encryptMessage(supabaseRef.current,currentUserId,otherUserId,matchId,text); const tempId = `temp-${Date.now()}`; const optimistic:Message = { id:tempId,sender_id:currentUserId,content:text,ciphertext:encrypted,encryption_version:1,created_at:new Date().toISOString() }; setMessages(prev => [...prev,optimistic]); setContent(""); triggerHaptic([20]); const result = await sendMessage(matchId,encrypted); if (result.error) { setError(result.error); setMessages(prev => prev.filter(m => m.id !== tempId)); return; } if (result.message) setMessages(prev => [...prev.filter(m => m.id !== tempId && m.id !== result.message!.id),{ ...result.message!,content:text }]); } catch (err) { setError(err instanceof Error ? err.message : "Failed to encrypt or deliver the message."); } finally { setLoading(false); } }
  function handleQuickIcebreaker(chip:string) { setContent(chip); inputRef.current?.focus(); }
  async function handleBlock() { setMenuOpen(false); if (!confirm(`Are you sure you want to block ${otherProfile.display_name}?`)) return; const result = await blockUser(otherUserId); if (result.error) { setError(result.error); return; } startTransition(() => { router.push(routes.messages); router.refresh(); }); }
  async function handleReportSubmit(e:React.FormEvent) { e.preventDefault(); setReportSubmitting(true); const result = await reportUser(otherUserId,reportReason,reportDetails); setReportSubmitting(false); if (result.error) { setError(result.error); return; } setReportModalOpen(false); startTransition(() => { router.push(routes.messages); router.refresh(); }); }
  const remaining = MAX_MESSAGE_LENGTH - content.length;
  const verified = otherProfile.verification_status === "verified";

  return <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white font-sans">
    <div className="flex shrink-0 items-center justify-center gap-1.5 border-b border-[#e5cbd0] bg-[#faf0f2] px-3 py-1.5 text-[9px] font-bold text-[#761f30]"><LockKeyhole className="h-3 w-3"/>{MESSAGE_ENCRYPTION_LABEL}<span className="hidden sm:inline"> · only you and your match can read new messages</span></div>
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-2.5 shadow-sm">
      <Link href={routes.messages} prefetch={false} aria-label="Back to chats" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 active:scale-95"><ChevronLeft className="h-4 w-4"/></Link>
      <Link href={`${routes.profileView}/${otherUserId}`} prefetch={false} className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-[#761f30] bg-[#faf0f2]">{otherPhotoUrl ? <Image src={otherPhotoUrl} alt={otherProfile.display_name ?? "Match"} fill priority sizes="32px" className="object-cover"/> : <div className="flex h-full w-full items-center justify-center text-xs font-black text-[#761f30]">{otherProfile.display_name?.charAt(0) ?? "?"}</div>}</div>
        <div className="min-w-0"><div className="flex min-w-0 items-center gap-1"><p className="truncate text-xs font-black text-zinc-950">{otherProfile.display_name ?? "Match"}</p>{verified&&<ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" aria-label="Verified"/>}</div><p className="truncate text-[9px] text-zinc-500">{otherProfile.department ?? "DateLocal match"}{otherProfile.academic_year ? ` · ${otherProfile.academic_year}` : ""}</p></div>
      </Link>
      <div className="relative"><button type="button" onClick={() => setMenuOpen(v => !v)} className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm active:scale-95" aria-label="Chat safety menu"><MoreVertical className="h-4 w-4"/></button>{menuOpen && <div className="absolute right-0 top-10 z-[120] w-48 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl"><button type="button" onClick={() => { setMenuOpen(false); setReportModalOpen(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-amber-800 hover:bg-amber-50"><Flag className="h-4 w-4"/>Report user</button><button type="button" onClick={handleBlock} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-rose-700 hover:bg-rose-50"><UserX className="h-4 w-4"/>Block user</button></div>}</div>
    </header>
    <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {loadingOlder&&<div className="sticky top-0 z-10 mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-[9px] font-bold text-zinc-500 shadow-sm"><Loader2 className="h-3 w-3 animate-spin"/>Loading older messages…</div>}
      {hasMore&&!loadingOlder&&messages.length>=40&&<button type="button" onClick={()=>void loadOlder()} className="mx-auto mb-3 flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[9px] font-bold text-zinc-500 shadow-sm"><ArrowUp className="h-3 w-3"/>Load older</button>}
      <div className="mx-auto mb-4 max-w-sm rounded-2xl border border-[#e5cbd0] bg-[#fffdfb] p-3.5 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2.5"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#761f30] bg-[#faf0f2]">{otherPhotoUrl ? <Image src={otherPhotoUrl} alt={otherProfile.display_name ?? "Match"} fill sizes="48px" className="object-cover"/> : <div className="flex h-full w-full items-center justify-center text-base font-black text-[#761f30]">{otherProfile.display_name?.charAt(0) ?? "?"}</div>}</div><div className="min-w-0 text-left"><h2 className="truncate text-sm font-black text-zinc-950">Matched with {firstName}{verified&&<ShieldCheck className="ml-1 inline h-3.5 w-3.5 text-emerald-600" aria-label="Verified"/>}</h2><p className="truncate text-[10px] text-zinc-500">{otherProfile.department ?? "Your match"}</p></div></div>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">{otherProfile.relationship_goal && <span className="rounded-full border border-[#e5cbd0] bg-[#faf0f2] px-2.5 py-1 text-[9px] font-bold text-[#761f30]">{otherProfile.relationship_goal}</span>}{otherProfile.campus_residency && <span className="flex items-center gap-0.5 rounded-full border border-[#e5cbd0] bg-white px-2 py-1 text-[9px] font-bold text-[#761f30]"><MapPin className="h-2.5 w-2.5"/>{otherProfile.campus_residency}</span>}{otherProfile.campus_hangout && <span className="flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[9px] font-bold text-zinc-700"><Coffee className="h-2.5 w-2.5"/>{otherProfile.campus_hangout}</span>}</div>
        {otherProfile.prompt_question && otherProfile.prompt_answer && <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-2 text-left"><span className="block text-[9px] font-bold text-[#761f30]">{otherProfile.prompt_question}</span><p className="mt-0.5 text-[11px] leading-snug text-zinc-800">&ldquo;{otherProfile.prompt_answer}&rdquo;</p></div>}
      </div>
      {messages.map((message,idx) => { const isMine = message.sender_id === currentUserId; const prev = messages[idx-1]; const same = !!prev && prev.sender_id === message.sender_id; return <div key={message.id} className={`mb-2.5 flex flex-col ${isMine ? "items-end" : "items-start"}`}><div className={`max-w-[82%] px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${isMine ? "rounded-2xl rounded-br-sm bg-[#761f30] text-white" : "rounded-2xl rounded-bl-sm border border-zinc-200 bg-white text-zinc-900"}`}><p className="whitespace-pre-wrap break-words">{message.content ?? "Decrypting…"}</p></div>{!same && <span className="mt-0.5 px-1.5 text-[9px] font-medium text-zinc-400">{formatMessageTime(message.created_at)}</span>}</div>; })}
      <div ref={bottomRef}/>
    </div>
    <div className="fixed inset-x-0 bottom-[0px] z-[90] border-t border-[#eee5e2] bg-[#fffdfb]/98 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl md:absolute md:mx-auto md:max-w-2xl" style={{ bottom:`${keyboardOffset}px` }}>
      {error && <div className="flex items-start gap-2 border-b border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-700"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>{error}</div>}
      {messages.length < 3 && <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-100 px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-zinc-500"><Sparkles className="h-3 w-3 text-[#761f30]"/>Icebreakers:</span>{icebreakers.map(chip => <button type="button" key={chip} onClick={() => handleQuickIcebreaker(chip)} className="shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-800 active:scale-95">{chip}</button>)}</div>}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-2.5 pb-[calc(.625rem+env(safe-area-inset-bottom))]"><div className="min-w-0 flex-1"><input ref={inputRef} value={content} onChange={e=>setContent(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} placeholder="Type a message…" className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-[#761f30]" aria-label="Message"/></div><button type="submit" disabled={loading||!secureReady||!content.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#761f30] text-white disabled:opacity-40" aria-label="Send message"><Send className="h-4 w-4"/></button></form>
      <div className="px-3 pb-2 text-right text-[8px] text-zinc-400">{remaining} characters left</div>
    </div>
    {reportModalOpen && <div className="fixed inset-0 z-[130] grid place-items-center bg-black/40 p-4"><form onSubmit={handleReportSubmit} className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-sm font-black">Report {otherProfile.display_name}</h2><button type="button" onClick={()=>setReportModalOpen(false)}><X className="h-4 w-4"/></button></div><select value={reportReason} onChange={e=>setReportReason(e.target.value)} className="mt-4 h-10 w-full rounded-xl border px-2 text-xs"><option>Inappropriate behavior</option><option>Harassment or abuse</option><option>Spam</option><option>Fake profile</option><option>Safety concern</option><option>Other</option></select><textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} maxLength={500} rows={4} placeholder="Details (optional)" className="mt-2 w-full rounded-xl border p-2 text-xs"/><div className="mt-3 flex gap-2"><Button type="button" variant="outline" onClick={()=>setReportModalOpen(false)} className="flex-1">Cancel</Button><Button type="submit" disabled={reportSubmitting} className="flex-1">{reportSubmitting?<Loader2 className="h-4 w-4 animate-spin"/>:"Send report"}</Button></div></form></div>}
  </div>
}
