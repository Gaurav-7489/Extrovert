import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !process.env.DATEBU_OWNER_ID || user.id !== process.env.DATEBU_OWNER_ID) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = String(body.paymentId || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!paymentId) return NextResponse.json({ error: "Missing payment ID." }, { status: 400 });
    if (reason.length < 3) return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });

    const admin = createAdminClient();
    const { data: payment, error } = await admin
      .from("upi_payment_submissions")
      .select("id,user_id,payment_type,product,amount_paise,utr,status,metadata")
      .eq("id", paymentId)
      .maybeSingle();

    if (error || !payment) return NextResponse.json({ error: "Payment submission not found." }, { status: 404 });
    if (payment.status === "rejected") return NextResponse.json({ success: true, alreadyRejected: true });
    if (payment.status === "approved") return NextResponse.json({ error: "Approved payments cannot be rejected from this flow." }, { status: 409 });
    if (payment.status !== "pending") return NextResponse.json({ error: "Payment is not awaiting review." }, { status: 409 });

    const rejectedAt = new Date().toISOString();
    const metadata = {
      ...((payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)) ? payment.metadata : {}),
      rejection: {
        reason,
        rejected_by: user.id,
        rejected_at: rejectedAt,
      },
    };

    const { data: updated, error: updateError } = await admin
      .from("upi_payment_submissions")
      .update({ status: "rejected", metadata, updated_at: rejectedAt })
      .eq("id", paymentId)
      .eq("status", "pending")
      .select("id,status")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) return NextResponse.json({ error: "Payment was already changed by another review action." }, { status: 409 });

    await admin.from("admin_audit_logs").insert({
      actor_id: user.id,
      action: "payment_rejected",
      entity_type: "upi_payment_submission",
      entity_id: paymentId,
      metadata: {
        payment_type: payment.payment_type,
        product: payment.product,
        amount_paise: payment.amount_paise,
        utr: payment.utr,
        reason,
      },
    });

    return NextResponse.json({ success: true, status: "rejected" });
  } catch (error) {
    console.error("UPI payment rejection failed:", error);
    return NextResponse.json({ error: "Unable to reject payment." }, { status: 500 });
  }
}
