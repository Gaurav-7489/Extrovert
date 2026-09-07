import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpiPaymentReview } from "@/components/admin/upi-payment-review";

export const dynamic = "force-dynamic";
export const metadata = { title: "UPI Payment Review | Extrovert", robots: { index: false, follow: false } };

type PaymentRow = {
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

export default async function AdminPaymentsPage() {
  const admin = await requireAdmin();
  if (!process.env.DATEBU_OWNER_ID || admin.id !== process.env.DATEBU_OWNER_ID) {
    return <main className="grid min-h-screen place-items-center bg-zinc-50 p-6 font-sans"><div className="max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 text-center"><p className="text-sm font-black">Payment review unavailable</p><p className="mt-2 text-xs text-zinc-500">UPI payment approval and rejection are restricted to the payment owner account.</p><Link href="/admin" className="mt-4 inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-xs font-black text-white">Back to admin</Link></div></main>;
  }

  const db = createAdminClient();
  const { data } = await db
    .from("upi_payment_submissions")
    .select("id,user_id,payment_type,product,amount_paise,utr,status,metadata,created_at,fraud_score,fraud_flags,fraud_review_required")
    .order("created_at", { ascending: false })
    .limit(100);

  const payments = (data ?? []) as PaymentRow[];

  return <main className="min-h-screen bg-zinc-50 p-4 font-sans text-zinc-950 sm:p-6">
    <div className="mx-auto max-w-4xl">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Link href="/admin" className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500" aria-label="Back"><ArrowLeft className="h-4 w-4"/></Link><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-600">Extrovert · Payments</p><h1 className="text-xl font-black">UPI payment review</h1></div></div>
        <CreditCard className="h-5 w-5 text-emerald-600"/>
      </header>
      <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">Reject only when the submitted payment cannot be verified. Rejected payments are terminal and cannot be reused; the user must create a new payment request.</section>
      <UpiPaymentReview initialPayments={payments}/>
    </div>
  </main>;
}
