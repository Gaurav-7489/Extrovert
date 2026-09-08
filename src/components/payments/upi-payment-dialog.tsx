"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, Copy, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import { parseAndroidIntentFromUpiUrl, EXTROVERT_UPI_ID } from "@/lib/upi";

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
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Detect platform once on client
  const isAndroid = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /android/i.test(navigator.userAgent);
  }, []);

  const isIos = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  async function preparePayment() {
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

      if (data.free) {
        setIsFree(true);
        setSubmitted(true);
        return;
      }

      const paymentIdValue = String(data.paymentId);
      setPaymentId(paymentIdValue);

      // Fetch the verified UPI URL
      const launchUrl = `/api/upi/launch?paymentId=${encodeURIComponent(paymentIdValue)}`;
      const launchResponse = await fetch(launchUrl, { cache: "no-store" });
      const launchData = await launchResponse.json();

      if (!launchResponse.ok || !launchData.success || typeof launchData.upiUrl !== "string") {
        throw new Error(launchData.error || "Unable to prepare the UPI app.");
      }

      setUpiUrl(launchData.upiUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare payment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void preparePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const launchHref = useMemo(() => {
    if (!upiUrl) return undefined;
    if (isAndroid) {
      return parseAndroidIntentFromUpiUrl(upiUrl);
    }
    // iOS and desktop use upi:// standard deep link
    return upiUrl;
  }, [upiUrl, isAndroid]);

  function copyUpiId() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(EXTROVERT_UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#550000]/40 bg-[#550000]/15 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Amount</p>
          <p className="mt-1 text-3xl font-black">₹{amountPaise / 100}</p>
          <p className="mt-2 text-[10px] leading-4 text-zinc-500">
            Tap below to open your installed UPI app (Google Pay, PhonePe, Paytm, or BHIM).
          </p>
        </div>

        {!paymentId && !submitted ? (
          <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#550000]/60 py-3.5 text-xs font-bold text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure UPI payment…
          </div>
        ) : submitted ? (
          <div className="mt-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/25 p-4 text-center">
            <Check className="mx-auto h-7 w-7 text-emerald-400" />
            <p className="mt-2 text-sm font-bold text-emerald-300">
              {isFree ? "Membership Activated" : "Payment submitted for review"}
            </p>
            <p className="mt-1 text-[11px] text-emerald-400">
              {isFree
                ? "Your complimentary membership is now active."
                : "We will activate the purchase once your transaction reference is verified."}
            </p>
            <button
              type="button"
              onClick={() => {
                onSubmitted?.();
                onClose();
              }}
              className="mt-3 w-full rounded-xl bg-emerald-600/30 py-2.5 text-xs font-bold text-emerald-200"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {launchHref ? (
              <a
                href={launchHref}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#550000] py-3.5 text-xs font-bold text-white active:scale-[0.99] transition-transform"
              >
                <ExternalLink className="h-4 w-4" /> Open UPI App &amp; Pay
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#550000]/50 py-3.5 text-xs font-bold text-white/60"
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing link…
              </button>
            )}

            {/* Fallback button for iOS & Desktop or when intent is blocked */}
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs">
              <span className="text-[11px] text-zinc-400 font-mono">UPI ID: {EXTROVERT_UPI_ID}</span>
              <button
                type="button"
                onClick={copyUpiId}
                className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy ID"}
              </button>
            </div>

            {isIos && (
              <p className="text-[10px] leading-4 text-zinc-500">
                On iPhone, tap above to open your default UPI app. If it doesn’t open, copy the UPI ID and pay via Google Pay or PhonePe.
              </p>
            )}

            <div>
              <label htmlFor="upi-utr" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                After paying, enter UTR / transaction ID
              </label>
              <input
                id="upi-utr"
                value={utr}
                onChange={(e) => setUtr(e.target.value.slice(0, 80))}
                placeholder="Enter 12-digit transaction ID"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161d] px-3.5 py-3 text-xs font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-red-700"
              />
            </div>

            <button
              type="button"
              onClick={() => void submitProof()}
              disabled={loading || !utr.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 text-xs font-bold text-zinc-100 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "I've paid — submit transaction"
              )}
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/25 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-red-400" /> Secure UPI payment · UTR required
        </div>
      </div>
    </div>
  );
}