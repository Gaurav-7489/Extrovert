import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUpiPaymentUrl } from "@/lib/upi";
import { getShopProduct, type ShopProduct } from "@/lib/shop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const paymentId = new URL(request.url).searchParams.get("paymentId");
    if (!paymentId) return NextResponse.json({ error: "Payment reference is missing." }, { status: 400 });

    const admin = createAdminClient();
    const { data: payment, error } = await admin
      .from("upi_payment_submissions")
      .select("id,user_id,payment_type,product,amount_paise,status,created_at,metadata")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !payment) return NextResponse.json({ error: "Payment reference not found." }, { status: 404 });
    if (payment.status !== "pending") return NextResponse.json({ error: "This payment is no longer active." }, { status: 409 });
    if (Date.now() - new Date(payment.created_at).getTime() > 15 * 60 * 1000) return NextResponse.json({ error: "This payment reference has expired. Start a new payment." }, { status: 410 });

    let note = "Extrovert payment";
    if (payment.payment_type === "subscription") {
      note = payment.product === "weekly" ? "Extrovert Beyond Weekly" : "Extrovert Beyond Monthly";
    } else {
      const config = getShopProduct(payment.product as ShopProduct);
      if (!config) return NextResponse.json({ error: "Payment product not found." }, { status: 400 });
      note = `Extrovert ${config.label}`;
    }

    const upiUrl = createUpiPaymentUrl({
      amountPaise: payment.amount_paise,
      note: `${note} REF ${payment.id.slice(0, 8)}`,
    });

    // Return the custom-scheme URL as data. Navigating an HTTP route that then
    // 302-redirects to upi:// can be blocked or mishandled by mobile browsers.
    // The client now launches the intent itself and can provide a visible fallback.
    return NextResponse.json({ success: true, upiUrl });
  } catch {
    return NextResponse.json({ error: "Unable to prepare the UPI app." }, { status: 500 });
  }
}
