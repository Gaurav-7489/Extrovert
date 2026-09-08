import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BillingPlan = "weekly" | "monthly";
const PLANS: Record<BillingPlan, { amountPaise: number; label: string }> = {
  weekly: { amountPaise: 3900, label: "Extrovert Beyond Weekly" },
  monthly: { amountPaise: 9900, label: "Extrovert Beyond Monthly" },
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const plan = String(body.plan) as BillingPlan;
    const config = PLANS[plan];
    if (!config) return NextResponse.json({ error: "Invalid billing plan." }, { status: 400 });
    const { data: identity } = await supabase.from("extrovert_profiles").select("gender").eq("id", user.id).maybeSingle();
    if (["woman", "female"].includes((identity?.gender ?? "").toLowerCase())) return NextResponse.json({ success: true, free: true, plan: "free" });
    const admin = createAdminClient();
    const { data: active } = await admin.from("subscriptions").select("plan,status,current_period_end").eq("user_id", user.id).maybeSingle();
    if (active?.plan === "pro" && ["active", "trialing"].includes(active.status) && active.current_period_end && new Date(active.current_period_end).getTime() > Date.now()) return NextResponse.json({ error: "Your Extrovert Beyond membership is already active." }, { status: 409 });
    const paymentId = crypto.randomUUID();
    const { error } = await admin.from("upi_payment_submissions").insert({ id: paymentId, user_id: user.id, payment_type: "subscription", product: plan, amount_paise: config.amountPaise, metadata: { plan } });
    if (error) throw error;
    return NextResponse.json({ success: true, paymentId, plan, amount: config.amountPaise, currency: "INR" });
  } catch (error) {
    console.error("UPI subscription creation failed:", error);
    return NextResponse.json({ error: "Unable to start UPI payment." }, { status: 500 });
  }
}
