"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { loadOlderMessages, sendMessage } from "../actions";
import { blockUser, reportUser } from "../../discover/actions";
import { routes } from "@/config/routes";
import {
  decryptMessage,
  encryptMessage,
  ensureOwnMessageKey,
  MESSAGE_ENCRYPTION_LABEL,
} from "@/lib/crypto/messages";
import {
  Send,
  MoreVertical,
  Flag,
  UserX,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  MapPin,
  Coffee,
  ChevronLeft,
  LockKeyhole,
  ShieldCheck,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  ciphertext: string | null;
  encryption_version: number;
  created_at: string;
};

type ProfileData = {
  id: string;
  display_name: string | null;
  department: string | null;
  academic_year: string | null;
  relationship_goal?: string | null;
  campus_residency?: string | null;
  campus_hangout?: string | null;
  zodiac?: string | null;
  prompt_question?: string | null;
  prompt_answer?: string | null;
  verification_status?: string | null;
};

type Props = {
  matchId: string;
  currentUserId: string;
  otherUserId: string;
  otherProfile: ProfileData;
  otherPhotoUrl: string | null;
  initialMessages: Message[];
};

const MAX_MESSAGE_LENGTH = 2000;

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function triggerHaptic(pattern: number[] = [15]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

export default function ChatClient({
  matchId,
  currentUserId,
  otherUserId,
  otherProfile,
  otherPhotoUrl,
  initialMessages,
}: Props) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialScrollRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const previousLengthRef = useRef(initialMessages.length);

  const [messages, setMessages] = useState<Message[]>(() => {
    const seen = new Set<string>();
    return initialMessages.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  });

  const [hasMore, setHasMore] = useState(initialMessages.length >= 40);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [secureReady, setSecureReady] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const firstName = otherProfile.display_name?.split(" ")[0] || "Match";
  const icebreakers = [
    "Catch up for coffee sometime?",
    "How has your week been going so far?",
    otherProfile.campus_hangout
      ? `Catch up around ${otherProfile.campus_hangout}?`
      : "What is your favorite local spot around here?",
    "Working on anything exciting today?",
  ];

  useEffect(() => {
    let alive = true;
    const supabase = supabaseRef.current;
    (async () => {
      try {
        await ensureOwnMessageKey(supabase, currentUserId);
        if (alive) setSecureReady(true);
      } catch {
        if (alive)
          setError("Secure messaging could not initialize on this device.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!secureReady) return;
    let alive = true;
    const supabase = supabaseRef.current;

    (async () => {
      const next = await Promise.all(
        initialMessages.map(async (m) => {
          if (m.content || !m.ciphertext || m.encryption_version !== 1) return m;
          try {
            return {
              ...m,
              content: await decryptMessage(
                supabase,
                currentUserId,
                otherUserId,
                matchId,
                m.ciphertext
              ),
            };
          } catch {
            return {
              ...m,
              content: "Unable to decrypt this message on this device.",
            };
          }
        })
      );
      if (alive) setMessages(next);
    })();

    const channel = supabase
      .channel(`chat_${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const incoming = payload.new as Message;
          if (incoming.sender_id === currentUserId) return;
          let hydrated: Message = {
            ...incoming,
            content: "Unable to decrypt this message on this device.",
          };
          if (incoming.ciphertext && incoming.encryption_version === 1) {
            try {
              hydrated = {
                ...incoming,
                content: await decryptMessage(
                  supabase,
                  currentUserId,
                  otherUserId,
                  matchId,
                  incoming.ciphertext
                ),
              };
            } catch {}
          }
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, hydrated]
          );
        }
      );

    void channel.subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [secureReady, matchId, currentUserId, otherUserId, initialMessages]);

  useEffect(() => {
    if (initialScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      initialScrollRef.current = false;
      previousLengthRef.current = messages.length;
      return;
    }
    if (loadingOlderRef.current) return;
    if (messages.length > previousLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    previousLengthRef.current = messages.length;
  }, [messages.length]);

  const loadOlder = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingOlderRef.current || messages.length === 0)
      return;
    const before = messages[0]?.created_at;
    if (!before) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setError("");
    const oldHeight = el.scrollHeight;
    const oldTop = el.scrollTop;

    try {
      const result = await loadOlderMessages(matchId, before);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.messages.length) {
        setHasMore(false);
        return;
      }
      const decrypted = await Promise.all(
        result.messages.map(async (m) => {
          if (m.content || !m.ciphertext || m.encryption_version !== 1)
            return m as Message;
          try {
            return {
              ...m,
              content: (await decryptMessage(
                supabaseRef.current,
                currentUserId,
                otherUserId,
                matchId,
                m.ciphertext
              )) as string,
            } as Message;
          } catch {
            return {
              ...m,
              content: "Unable to decrypt this message on this device.",
            } as Message;
          }
        })
      );
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        return [...decrypted.filter((m) => !existing.has(m.id)), ...prev];
      });
      setHasMore(result.hasMore);
      requestAnimationFrame(() => {
        const nextHeight = el.scrollHeight;
        el.scrollTop = oldTop + (nextHeight - oldHeight);
      });
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [hasMore, matchId, messages, currentUserId, otherUserId]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (e.currentTarget.scrollTop < 100) void loadOlder();
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const viewport = window.visualViewport;
    let raf = 0;
    const update = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setKeyboardOffset(
          Math.max(
            0,
            Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
          )
        );
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const onFocus = () =>
      window.setTimeout(
        () => el.scrollIntoView({ block: "center", behavior: "smooth" }),
        120
      );
    el.addEventListener("focus", onFocus);
    return () => el.removeEventListener("focus", onFocus);
  }, []);

  async function handleSend(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const text = content.trim();
    if (!text || loading) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    if (!secureReady) {
      setError(
        "Secure messaging is still starting. Please try again in a moment."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const encrypted = await encryptMessage(
        supabaseRef.current,
        currentUserId,
        otherUserId,
        matchId,
        text
      );
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        sender_id: currentUserId,
        content: text,
        ciphertext: encrypted,
        encryption_version: 1,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setContent("");
      triggerHaptic([20]);
      const result = await sendMessage(matchId, encrypted);
      if (result.error) {
        setError(result.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      if (result.message) {
        setMessages((prev) => [
          ...prev.filter(
            (m) => m.id !== tempId && m.id !== result.message!.id
          ),
          { ...result.message!, content: text },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to encrypt or deliver the message."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleQuickIcebreaker(chip: string) {
    setContent(chip);
    inputRef.current?.focus();
  }

  async function handleBlock() {
    setMenuOpen(false);
    if (
      !confirm(`Are you sure you want to block ${otherProfile.display_name}?`)
    )
      return;
    const result = await blockUser(otherUserId);
    if (result.error) {
      setError(result.error);
      return;
    }
    startTransition(() => {
      router.push(routes.messages);
      router.refresh();
    });
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReportSubmitting(true);
    const result = await reportUser(otherUserId, reportReason, reportDetails);
    setReportSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setReportModalOpen(false);
    startTransition(() => {
      router.push(routes.messages);
      router.refresh();
    });
  }

  const remaining = MAX_MESSAGE_LENGTH - content.length;
  const verified = otherProfile.verification_status === "verified";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white font-sans text-zinc-950 transition-colors dark:bg-[#0a0a0c] dark:text-zinc-50">
      {/* End-to-End Encryption Banner */}
      <div className="flex shrink-0 items-center justify-center gap-1.5 border-b border-[#550000]/15 bg-[#550000]/5 px-3 py-1.5 text-[10px] font-semibold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">
        <LockKeyhole className="h-3 w-3 shrink-0" />
        <span>{MESSAGE_ENCRYPTION_LABEL}</span>
        <span className="hidden sm:inline">
          · only you two can read new messages
        </span>
      </div>

      {/* Top Bar Header */}
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200/90 bg-white/95 px-3 backdrop-blur-md dark:border-white/10 dark:bg-[#0a0a0c]/95">
        <Link
          href={routes.messages}
          prefetch={false}
          aria-label="Back to messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/80 text-zinc-700 shadow-2xs transition hover:border-zinc-300 active:scale-95 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <Link
          href={`${routes.profileView}/${otherUserId}`}
          prefetch={false}
          className="flex min-w-0 flex-1 items-center gap-2.5 transition-transform active:scale-[0.99]"
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#550000]/30 bg-zinc-100 dark:border-red-500/40 dark:bg-[#141419]">
            {otherPhotoUrl ? (
              <Image
                src={otherPhotoUrl}
                alt={otherProfile.display_name ?? "Match"}
                fill
                priority
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#550000] dark:text-red-400">
                {otherProfile.display_name?.charAt(0) ?? "?"}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <p className="truncate text-xs font-bold text-zinc-950 dark:text-zinc-50 sm:text-sm">
                {otherProfile.display_name ?? "Match"}
              </p>
              {verified && (
                <ShieldCheck
                  className="h-3.5 w-3.5 shrink-0 text-[#550000] dark:text-red-400"
                  aria-label="Verified"
                />
              )}
            </div>
            <p className="truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {otherProfile.department ?? "DateBu match"}
              {otherProfile.academic_year
                ? ` · ${otherProfile.academic_year}`
                : ""}
            </p>
          </div>
        </Link>

        {/* Safety Options Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/80 text-zinc-600 shadow-2xs transition hover:border-zinc-300 active:scale-95 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-300"
            aria-label="Chat safety menu"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-[120] w-48 rounded-2xl border border-zinc-200/90 bg-white p-1.5 shadow-xl transition-colors dark:border-white/10 dark:bg-[#141419]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setReportModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-amber-800 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Report user</span>
              </button>
              <button
                type="button"
                onClick={handleBlock}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Block user</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-4 pb-44 no-scrollbar [-webkit-overflow-scrolling:touch]"
      >
        {loadingOlder && (
          <div className="sticky top-0 z-10 mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-zinc-500 shadow-sm dark:border-white/10 dark:bg-[#16161d]/95 dark:text-zinc-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading older messages…</span>
          </div>
        )}

        {hasMore && !loadingOlder && messages.length >= 40 && (
          <button
            type="button"
            onClick={() => void loadOlder()}
            className="mx-auto mb-3 flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-zinc-600 shadow-2xs transition active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-300"
          >
            <ArrowUp className="h-3 w-3" />
            <span>Load older</span>
          </button>
        )}

        {/* Conversation Starter Hero Card */}
        <div className="mx-auto mb-5 max-w-sm rounded-3xl border border-zinc-200/90 bg-zinc-50/80 p-4 text-center shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
          <div className="flex items-center justify-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#550000]/40 bg-white shadow-2xs dark:border-red-500/40 dark:bg-[#181820]">
              {otherPhotoUrl ? (
                <Image
                  src={otherPhotoUrl}
                  alt={otherProfile.display_name ?? "Match"}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#550000] dark:text-red-400">
                  {otherProfile.display_name?.charAt(0) ?? "?"}
                </div>
              )}
            </div>

            <div className="min-w-0 text-left">
              <h2 className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
                Connected with {firstName}
                {verified && (
                  <ShieldCheck
                    className="ml-1 inline h-3.5 w-3.5 text-[#550000] dark:text-red-400"
                    aria-label="Verified"
                  />
                )}
              </h2>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {otherProfile.department ?? "DateBu Match"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {otherProfile.relationship_goal && (
              <span className="rounded-full border border-[#550000]/20 bg-[#550000]/5 px-2.5 py-0.5 text-[9px] font-semibold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">
                {otherProfile.relationship_goal}
              </span>
            )}
            {otherProfile.campus_residency && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[9px] font-semibold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                <MapPin className="h-2.5 w-2.5" />
                {otherProfile.campus_residency}
              </span>
            )}
            {otherProfile.campus_hangout && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[9px] font-semibold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                <Coffee className="h-2.5 w-2.5" />
                {otherProfile.campus_hangout}
              </span>
            )}
          </div>

          {otherProfile.prompt_question && otherProfile.prompt_answer && (
            <div className="mt-2.5 rounded-2xl border border-zinc-200/80 bg-white p-2.5 text-left shadow-2xs dark:border-white/10 dark:bg-[#181820]">
              <span className="block text-[10px] font-bold text-[#550000] dark:text-red-300">
                {otherProfile.prompt_question}
              </span>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                &ldquo;{otherProfile.prompt_answer}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Message Thread Bubbles */}
        {messages.map((message, idx) => {
          const isMine = message.sender_id === currentUserId;
          const prev = messages[idx - 1];
          const same = !!prev && prev.sender_id === message.sender_id;

          return (
            <div
              key={message.id}
              className={`mb-2.5 flex flex-col ${
                isMine ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[82%] px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  isMine
                    ? "rounded-2xl rounded-br-xs border border-[#550000]/40 bg-[#550000] text-white"
                    : "rounded-2xl rounded-bl-xs border border-zinc-200/90 bg-zinc-50 text-zinc-900 dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-100"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content ?? "Decrypting…"}
                </p>
              </div>

              {!same && (
                <span className="mt-0.5 px-1.5 text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
                  {formatMessageTime(message.created_at)}
                </span>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Floating Input Dock */}
      <div
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-200/90 bg-white/98 shadow-[0_-6px_25px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#0a0a0c]/98 md:absolute md:mx-auto md:max-w-md"
        style={{ bottom: `${keyboardOffset}px` }}
      >
        {error && (
          <div className="flex items-start gap-2 border-b border-rose-200 bg-rose-50 px-3.5 py-2 text-[11px] font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {messages.length < 3 && (
          <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-100 px-3 py-2 no-scrollbar dark:border-white/5">
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
              <Sparkles className="h-3 w-3 text-[#550000] dark:text-red-400" />
              Icebreakers:
            </span>
            {icebreakers.map((chip) => (
              <button
                type="button"
                key={chip}
                onClick={() => handleQuickIcebreaker(chip)}
                className="shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-800 shadow-2xs transition hover:border-[#550000]/30 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]"
        >
          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Type a message…"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000] dark:focus:bg-[#121216]"
              aria-label="Message"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !secureReady || !content.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#550000]/40 bg-[#550000] text-white shadow-sm shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>

        <div className="px-3.5 pb-1.5 text-right text-[8px] font-medium text-zinc-400 dark:text-zinc-500">
          {remaining} characters left
        </div>
      </div>

      {/* Report User Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-sm rounded-[2rem] border border-zinc-200/90 bg-white p-5 shadow-2xl transition-colors dark:border-white/10 dark:bg-[#141419]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                Report {otherProfile.display_name}
              </h2>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-3 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-1 h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-3 text-xs text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-100"
            >
              <option>Inappropriate behavior</option>
              <option>Harassment or abuse</option>
              <option>Spam</option>
              <option>Fake profile</option>
              <option>Safety concern</option>
              <option>Other</option>
            </select>

            <label className="mt-3 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Details (optional)
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What happened?"
              className="mt-1 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-100"
            />

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReportModalOpen(false)}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={reportSubmitting}
                className="flex-1 rounded-2xl border border-[#550000]/30 bg-[#550000] text-white hover:bg-[#680202]"
                leftIcon={
                  reportSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : undefined
                }
              >
                {reportSubmitting ? "Sending…" : "Send report"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}