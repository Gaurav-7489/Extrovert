"use client";

import { useState } from "react";
import { Check, Clipboard, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";

export type UpiPaymentDialogProps = {
  endpoint: string;
  body: Record<string, unknown>;
  amountPaise: number;
  title: string;
  description: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function UpiPaymentDialog({
  endpoint,
  body,
  amountPaise,
  title,
  description,
  onClose,
  onSubmitted,
}: UpiPaymentDialogProps) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function start() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to start payment.");
      }
      setPaymentId(data.paymentId);
      setUpiUrl(data.upiUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
    } finally {
      setLoading(false);
    }
  }

  async function submitProof() {
    if (!paymentId || !utr.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/upi/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, utr: utr.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to submit transaction reference.");
      }
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit transaction reference."
      );
    } finally {
      setLoading(false);
    }
  }

  function copyUpi() {
    void navigator.clipboard?.writeText("gauravbhardwaj7489@okaxis");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md rounded-[2rem] border border-zinc-200/90 bg-white p-5 text-zinc-950 shadow-2xl transition-colors dark:border-white/10 dark:bg-[#121216] dark:text-zinc-50 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
              DIRECT UPI
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-400 dark:hover:bg-[#202028] dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount & UPI Details Card */}
        <div className="mt-5 rounded-2xl border border-[#550000]/20 bg-[#550000]/5 p-4 transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
            Amount
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            ₹{amountPaise / 100}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-2xs dark:border-white/10 dark:bg-[#181820]">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                UPI ID
              </p>
              <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                gauravbhardwaj7489@okaxis
              </p>
            </div>
            <button
              type="button"
              onClick={copyUpi}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 active:scale-95 dark:border-white/10 dark:bg-[#22222d] dark:text-zinc-200 dark:hover:bg-[#2c2c3a]"
              aria-label="Copy UPI ID"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" />
                  <span className="text-[10px] text-[#550000] dark:text-red-400">Copied</span>
                </>
              ) : (
                <>
                  <Clipboard className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action States */}
        {!paymentId ? (
          <button
            type="button"
            onClick={() => void start()}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] py-3.5 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing…</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                <span>Continue to UPI</span>
              </>
            )}
          </button>
        ) : submitted ? (
          <div className="mt-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 p-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/25">
            <Check className="mx-auto h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Payment submitted for review
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
              We&apos;ll activate your purchase as soon as transaction verification completes.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                if (upiUrl) window.location.href = upiUrl;
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] py-3.5 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] dark:bg-[#550000] dark:hover:bg-[#6e0303]"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open UPI app &amp; pay</span>
            </button>

            <div>
              <label
                className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                htmlFor="upi-utr"
              >
                After paying, enter UTR / transaction ID
              </label>
              <input
                id="upi-utr"
                value={utr}
                onChange={(e) => setUtr(e.target.value.slice(0, 80))}
                placeholder="e.g. 123456789012"
                className="mt-1.5 w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-3 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#550000]/15 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000]"
              />
            </div>

            <button
              type="button"
              onClick={() => void submitProof()}
              disabled={loading || !utr.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-900 py-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-black active:scale-[0.98] disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                "I've paid — submit transaction"
              )}
            </button>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-rose-200/90 bg-rose-50/90 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" />
          <span>Direct UPI · manual payment verification</span>
        </div>
      </div>
    </div>
  );
}