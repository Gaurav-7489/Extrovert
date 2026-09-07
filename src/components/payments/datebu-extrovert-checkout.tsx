"use client";
import { memo, useState } from "react";
import { Crown, Sparkles, Zap } from "lucide-react";
import { UpiPaymentDialog } from "@/components/payments/upi-payment-dialog";

type BillingPlan = "weekly" | "monthly";
const PLANS: Record<BillingPlan, { name: string; price: number; description: string; badge?: string }> = {
  weekly: { name: "Weekly Extrovert Beyond", price: 39, description: "Beyond features for 7 days" },
  monthly: { name: "Monthly Extrovert Beyond", price: 99, description: "More visibility & controls for 30 days", badge: "Most Popular" },
};
export const DateBuExtrovertCheckout = memo(function ExtrovertBeyondCheckout() {
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  return <div className="space-y-5 font-sans"><div className="grid gap-3.5 sm:grid-cols-2">{(Object.keys(PLANS) as BillingPlan[]).map(key => { const config = PLANS[key]; return <button key={key} type="button" onClick={() => setPlan(key)} className="group relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e5cbd0] hover:shadow-md active:scale-[.98]">{config.badge&&<div className="absolute right-4 top-4 rounded-full bg-[#e50914] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">{config.badge}</div>}<div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600"><Zap className="h-4 w-4"/></div><span className="text-xs font-black uppercase tracking-wider text-zinc-600">{config.name}</span></div><div className="mb-1 flex items-baseline gap-1"><span className="text-3xl font-black tracking-tight text-zinc-950">₹{config.price}</span><span className="text-xs font-semibold text-zinc-400">/{key === "weekly" ? "wk" : "mo"}</span></div><p className="mb-5 text-xs leading-relaxed text-zinc-500">{config.description}</p><div className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-xs font-bold text-white group-hover:bg-[#e50914]"><Sparkles className="h-3.5 w-3.5"/>Pay with UPI</div></button>})}</div><div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-500"><Crown className="h-4 w-4 text-red-600"/> Direct UPI payment to Extrovert</div>{plan&&<UpiPaymentDialog endpoint="/api/upi/create-subscription" body={{plan}} amountPaise={PLANS[plan].price*100} title={PLANS[plan].name} description="Pay directly from your UPI app. Your membership is activated after the transaction is verified." onClose={() => setPlan(null)} onSubmitted={() => setPlan(null)}/>}</div>;
});
DateBuExtrovertCheckout.displayName = "ExtrovertBeyondCheckout";
