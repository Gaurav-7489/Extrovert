import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !process.env.DATEBU_OWNER_ID || user.id !== process.env.DATEBU_OWNER_ID) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const paymentId = String(body.paymentId || "");
    if (!paymentId) return NextResponse.json({ error: "Missing payment ID." }, { status: 400 });

    const admin = createAdminClient();
    const { data: payment, error } = await admin.from("upi_payment_submissions").select("id,user_id,payment_type,product,amount_paise,status,metadata").eq("id", paymentId).maybeSingle();
    if (error || !payment) return NextResponse.json({ error: "Payment submission not found." }, { status: 404 });
    if (payment.status === "approved") return NextResponse.json({ success: true, alreadyApproved: true });

    if (payment.payment_type === "shop") {
      const shopOrderId = String((payment.metadata as { shop_order_id?: string } | null)?.shop_order_id || "");
      if (!shopOrderId) return NextResponse.json({ error: "Shop order reference is missing." }, { status: 400 });
      const { error: fulfillError } = await admin.rpc("fulfill_shop_order", { p_order_id: shopOrderId });
      if (fulfillError) return NextResponse.json({ error: "Payment found, but shop fulfillment failed: " + fulfillError.message }, { status: 500 });
    } else if (payment.payment_type === "subscription") {
      const days = payment.product === "weekly" ? 7 : payment.product === "monthly" ? 30 : 0;
      if (!days) return NextResponse.json({ error: "Invalid subscription product." }, { status: 400 });
      const start = new Date();
      const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      const { error: subscriptionError } = await admin.from("subscriptions").upsert({ user_id: payment.user_id, plan: "pro", status: "active", current_period_start: start.toISOString(), current_period_end: end.toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (subscriptionError) return NextResponse.json({ error: "Payment found, but membership activation failed." }, { status: 500 });
    }

    const { error: markError } = await admin.from("upi_payment_submissions").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", paymentId);
    if (markError) throw markError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPI payment approval failed:", error);
    return NextResponse.json({ error: "Unable to approve payment." }, { status: 500 });
  }
}
