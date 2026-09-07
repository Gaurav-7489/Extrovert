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

export function UpiPaymentDialog({ endpoint, body, amountPaise, title, description, onClose, onSubmitted }: UpiPaymentDialogProps) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    try {
      setLoading(true); setError(null);
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to start payment.");
      setPaymentId(data.paymentId); setUpiUrl(data.upiUrl);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to start payment."); }
    finally { setLoading(false); }
  }

  async function submitProof() {
    if (!paymentId || !utr.trim()) return;
    try {
      setLoading(true); setError(null);
      const response = await fetch("/api/upi/submit-proof", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId, utr: utr.trim() }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to submit transaction reference.");
      setSubmitted(true); onSubmitted?.();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit transaction reference."); }
    finally { setLoading(false); }
  }

  function copyUpi() { void navigator.clipboard?.writeText("gauravbhardwaj7489@okaxis"); }

  return <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md"><div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-5 text-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,.25)] sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#761f30]">DIRECT UPI</p><h2 className="mt-1 text-xl font-black">{title}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-zinc-50" aria-label="Close"><X className="h-4 w-4"/></button></div>
    <div className="mt-5 rounded-2xl border border-[#e5cbd0] bg-[#faf0f2] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-[#761f30]">Amount</p><p className="mt-1 text-3xl font-black">₹{amountPaise / 100}</p><div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white bg-white p-3"><div><p className="text-[9px] font-bold text-zinc-400">UPI ID</p><p className="text-xs font-black break-all">gauravbhardwaj7489@okaxis</p></div><button type="button" onClick={copyUpi} className="shrink-0 rounded-lg border border-zinc-200 p-2" aria-label="Copy UPI ID"><Clipboard className="h-4 w-4"/></button></div></div>
    {!paymentId ? <button type="button" onClick={() => void start()} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 py-3.5 text-xs font-black text-white disabled:opacity-50">{loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Preparing…</> : <><ExternalLink className="h-4 w-4"/>Continue to UPI</>}</button> : submitted ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center"><Check className="mx-auto h-7 w-7 text-emerald-600"/><p className="mt-2 text-sm font-black text-emerald-800">Payment submitted for review</p><p className="mt-1 text-[10px] leading-4 text-emerald-700">We’ll activate the purchase after the transaction is verified.</p></div> : <div className="mt-4 space-y-3"><button type="button" onClick={() => { if (upiUrl) window.location.href = upiUrl; }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#761f30] py-3.5 text-xs font-black text-white"><ExternalLink className="h-4 w-4"/>Open UPI app & pay</button><div><label className="text-[9px] font-black uppercase tracking-wider text-zinc-400" htmlFor="upi-utr">After paying, enter UTR / transaction ID</label><input id="upi-utr" value={utr} onChange={e => setUtr(e.target.value.slice(0,80))} placeholder="e.g. 123456789012" className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-3 text-xs font-semibold outline-none focus:border-[#761f30]"/></div><button type="button" onClick={() => void submitProof()} disabled={loading || !utr.trim()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 py-3.5 text-xs font-black text-white disabled:opacity-45">{loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Submitting…</> : "I've paid — submit transaction"}</button></div>}
    {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] font-bold text-rose-700">{error}</p>}
    <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-zinc-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600"/> Direct UPI · manual payment verification</div>
  </div></div>;
}
