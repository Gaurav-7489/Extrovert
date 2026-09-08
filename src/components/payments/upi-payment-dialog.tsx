"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";

export type UpiPaymentDialogProps = {
  endpoint: string;
  body: Record<string, unknown>;
  amountPaise: number;
  title: string;
  description: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function UpiPaymentDialog({ endpoint, body, amountPaise, title, description, onClose, onSubmitted }: UpiPaymentDialogProps) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to start payment.");
      if (data.free) {
        setSubmitted(true);
        onSubmitted?.();
        return;
      }

      const nextLaunchUrl = `/api/upi/launch?paymentId=${encodeURIComponent(data.paymentId)}`;
      setPaymentId(data.paymentId);
      setLaunchUrl(nextLaunchUrl);
      setRedirected(true);
      setLoading(false);
      if (typeof window !== "undefined") window.location.assign(nextLaunchUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
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
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to submit transaction reference.");
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit transaction reference.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#121216] p-5 text-zinc-50 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-red-400">UPI PAYMENT</p>
            <h2 className="mt-1 text-xl font-bold">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-400" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#550000]/40 bg-[#550000]/15 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Amount</p>
          <p className="mt-1 text-3xl font-black">₹{amountPaise / 100}</p>
          <p className="mt-2 text-[10px] leading-4 text-zinc-500">Tap Continue to UPI. On your phone, Extrovert will open your installed UPI app or the UPI app chooser.</p>
        </div>

        {!paymentId && !submitted && !redirected ? (
          <button type="button" onClick={() => void start()} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#550000] py-3.5 text-xs font-bold text-white disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing payment…</> : <><ExternalLink className="h-4 w-4" /> Continue to UPI</>}
          </button>
        ) : submitted ? (
          <div className="mt-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/25 p-4 text-center"><Check className="mx-auto h-7 w-7 text-emerald-400" /><p className="mt-2 text-sm font-bold text-emerald-300">Payment submitted for review</p><p className="mt-1 text-[11px] text-emerald-400">We will activate the purchase after the transaction is verified.</p></div>
        ) : (
          <div className="mt-4 space-y-3">
            <a href={launchUrl ?? undefined} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#550000] py-3.5 text-xs font-bold text-white"><ExternalLink className="h-4 w-4" /> Open UPI app &amp; pay</a>
            <p className="text-[10px] leading-4 text-zinc-500">If your phone did not open a UPI app, tap the button above once more. The UPI app itself will show the payment recipient and amount.</p>
            <div><label htmlFor="upi-utr" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">After paying, enter UTR / transaction ID</label><input id="upi-utr" value={utr} onChange={(e) => setUtr(e.target.value.slice(0, 80))} placeholder="Enter transaction ID" className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161d] px-3.5 py-3 text-xs font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-red-700" /></div>
            <button type="button" onClick={() => void submitProof()} disabled={loading || !utr.trim()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 text-xs font-bold text-zinc-100 disabled:opacity-40">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "I've paid — submit transaction"}</button>
          </div>
        )}
        {error && <p role="alert" className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/25 px-3.5 py-2.5 text-xs font-semibold text-rose-300">{error}</p>}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500"><ShieldCheck className="h-3.5 w-3.5 text-red-400" /> Secure UPI payment · UTR required</div>
      </div>
    </div>
  );
}
