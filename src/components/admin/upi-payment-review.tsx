"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type Payment = {
  id: string;
  user_id: string;
  payment_type: string;
  product: string;
  amount_paise: number;
  utr: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  fraud_score: number;
  fraud_flags: string[];
  fraud_review_required: boolean;
};

function rejectionReason(payment: Payment) {
  const value = payment.metadata?.rejection;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const reason = (value as { reason?: unknown }).reason;
  return typeof reason === "string" ? reason : null;
}

export function UpiPaymentReview({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(paymentId: string) {
    setBusy(paymentId); setError(null);
    try {
      const response = await fetch("/api/upi/admin/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to approve payment.");
      setPayments(current => current.map(payment => payment.id === paymentId ? { ...payment, status: "approved" } : payment));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to approve payment."); }
    finally { setBusy(null); }
  }

  async function reject(paymentId: string) {
    const reason = window.prompt("Reason for rejecting this payment:", "UTR could not be verified");
    if (reason === null) return;
    if (reason.trim().length < 3) { setError("Enter a rejection reason."); return; }
    setBusy(paymentId); setError(null);
    try {
      const response = await fetch("/api/upi/admin/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId, reason: reason.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to reject payment.");
      setPayments(current => current.map(payment => payment.id === paymentId ? { ...payment, status: "rejected", metadata: { ...(payment.metadata || {}), rejection: { reason: reason.trim() } } } : payment));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to reject payment."); }
    finally { setBusy(null); }
  }

  return <div className="space-y-3">
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700">{error}</div>}
    {payments.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-xs font-semibold text-zinc-500">No UPI payment submissions yet.</div> : payments.map(payment => {
      const reason = rejectionReason(payment);
      const actionable = payment.status === "pending";
      return <article key={payment.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5 text-[10px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${payment.status === "approved" ? "bg-emerald-50 text-emerald-700" : payment.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{payment.status}</span>
              <span className="font-black">{payment.payment_type} · {payment.product}</span>
              <span className="font-black">₹{(payment.amount_paise / 100).toFixed(2)}</span>
            </div>
            <p className="break-all"><b>Payment ID:</b> {payment.id}</p>
            <p className="break-all"><b>User ID:</b> {payment.user_id}</p>
            <p><b>UTR:</b> {payment.utr || "Not submitted"}</p>
            <p><b>Created:</b> {new Date(payment.created_at).toLocaleString("en-IN")}</p>
            {payment.fraud_review_required && <p className="font-bold text-rose-700"><b>Fraud review:</b> score {payment.fraud_score} · {payment.fraud_flags.join(", ") || "flagged"}</p>}
            {reason && <div className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 text-rose-800"><b>Rejection reason:</b> {reason}</div>}
          </div>
          {actionable && <div className="grid w-full gap-2 sm:w-44">
            <button type="button" onClick={() => void approve(payment.id)} disabled={busy === payment.id} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-50">{busy === payment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5"/>}Approve</button>
            <button type="button" onClick={() => void reject(payment.id)} disabled={busy === payment.id} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] font-black text-rose-700 disabled:opacity-50"><XCircle className="h-3.5 w-3.5"/>Reject</button>
          </div>}
        </div>
      </article>;
    })}
  </div>;
}
