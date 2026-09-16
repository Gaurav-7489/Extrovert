"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { encryptMessage, decryptMessage, ensureOwnMessageKey, MESSAGE_ENCRYPTION_LABEL } from "@/lib/crypto/messages";
import { sendSocialMessage } from "./actions";
import { Send, Loader2, AlertCircle, LockKeyhole } from "lucide-react";

type Message = { id: string; sender_id: string; ciphertext: string; created_at: string; read_at?: string | null; content?: string };
type Props = { conversationId: string; currentUserId: string; otherUserId: string; initialMessages: Message[] };
const MAX_MESSAGE_LENGTH = 2000;
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

export default function SocialChatClient({ conversationId, currentUserId, otherUserId, initialMessages }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => { try { await ensureOwnMessageKey(supabase, currentUserId); if (alive) setReady(true); } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Secure messaging could not initialize on this device."); } })();
    return () => { alive = false; };
  }, [supabase, currentUserId]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      const hydrated = await Promise.all(initialMessages.map(async message => {
        try { return { ...message, content: await decryptMessage(supabase, currentUserId, otherUserId, conversationId, message.ciphertext) }; }
        catch { return { ...message, content: "Unable to decrypt this message on this device." }; }
      }));
      if (alive) setMessages(hydrated);
    })();
    const channel = supabase.channel(`social_chat_${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "extrovert_messages", filter: `conversation_id=eq.${conversationId}` }, async payload => {
      const incoming = payload.new as Message;
      if (incoming.sender_id === currentUserId) return;
      const hydrated: Message = { ...incoming, content: "Unable to decrypt this message." };
      try { hydrated.content = await decryptMessage(supabase, currentUserId, otherUserId, conversationId, incoming.ciphertext); } catch {}
      setMessages(prev => prev.some(m => m.id === incoming.id) ? prev : [...prev, hydrated]);
    }).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [ready, conversationId, currentUserId, otherUserId, supabase, initialMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault(); const text = content.trim(); if (!text || sending || !ready) return;
    if (text.length > MAX_MESSAGE_LENGTH) { setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`); return; }
    setSending(true); setError(""); const tempId = `temp-${Date.now()}`;
    try {
      const ciphertext = await encryptMessage(supabase, currentUserId, otherUserId, conversationId, text);
      setMessages(prev => [...prev, { id: tempId, sender_id: currentUserId, ciphertext, content: text, created_at: new Date().toISOString() }]); setContent("");
      const result = await sendSocialMessage(conversationId, ciphertext);
      if (result.error) { setMessages(prev => prev.filter(m => m.id !== tempId)); setContent(text); setError(result.error); return; }
      if (result.message) setMessages(prev => [...prev.filter(m => m.id !== tempId && m.id !== result.message.id), { ...result.message, content: text }]);
    } catch (err) { setMessages(prev => prev.filter(m => m.id !== tempId)); setContent(text); setError(err instanceof Error ? err.message : "Failed to send message."); }
    finally { setSending(false); }
  }

  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
    <div className="flex shrink-0 items-center justify-center gap-1.5 border-b border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[9px] font-bold text-emerald-800"><LockKeyhole className="h-3 w-3" />{MESSAGE_ENCRYPTION_LABEL} · only conversation members can read messages</div>
    <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 no-scrollbar">{messages.map(message => { const mine = message.sender_id === currentUserId; return <div key={message.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}><div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${mine ? "rounded-br-sm bg-emerald-600 text-white" : "rounded-bl-sm border border-zinc-200 bg-white text-zinc-900"}`}><p className="whitespace-pre-wrap break-words">{message.content ?? "Decrypting…"}</p></div><span className="mt-0.5 px-1.5 text-[9px] text-zinc-400">{formatTime(message.created_at)}</span></div>; })}{messages.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-xs text-zinc-500">No messages yet. Start the conversation.</div>}<div ref={bottomRef} /></div>
    {error && <div className="flex shrink-0 items-center gap-2 border-t border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"><AlertCircle className="h-3.5 w-3.5" />{error}</div>}
    <form onSubmit={handleSend} className="flex shrink-0 items-end gap-2 border-t border-zinc-200 bg-white p-2.5 pb-[calc(.625rem+env(safe-area-inset-bottom))]"><textarea value={content} onChange={e => setContent(e.target.value.slice(0, MAX_MESSAGE_LENGTH))} maxLength={MAX_MESSAGE_LENGTH} rows={1} disabled={!ready || sending} placeholder={ready ? "Write a message..." : "Starting secure chat..."} className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"/><button type="submit" disabled={!ready || sending || !content.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white active:scale-95 disabled:opacity-40" aria-label="Send message">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></form>
  </div>;
}
