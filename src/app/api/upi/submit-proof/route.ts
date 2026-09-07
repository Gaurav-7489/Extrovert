import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const paymentId = String(body.paymentId || "");
    const utr = String(body.utr || "").trim();
    if (!paymentId || !utr || !/^[A-Za-z0-9_-]{6,80}$/.test(utr)) return NextResponse.json({ error: "Enter the UPI transaction/UTR reference exactly as shown in your payment app." }, { status: 400 });

    const admin = createAdminClient();
    const { data: payment, error } = await admin.from("upi_payment_submissions").select("id,user_id,status").eq("id", paymentId).maybeSingle();
    if (error || !payment || payment.user_id !== user.id) return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    if (payment.status === "approved") return NextResponse.json({ success: true, status: "approved" });
    if (payment.status === "rejected") return NextResponse.json({ error: "This payment was rejected. Create a new payment request instead of reusing the rejected one." }, { status: 409 });

    const { error: updateError } = await admin
      .from("upi_payment_submissions")
      .update({ utr, status: "pending", updated_at: new Date().toISOString() })
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .in("status", ["pending"]);
    if (updateError) throw updateError;
    return NextResponse.json({ success: true, status: "pending" });
  } catch (error) {
    console.error("UPI proof submission failed:", error);
    return NextResponse.json({ error: "Unable to submit the transaction reference." }, { status: 500 });
  }
}