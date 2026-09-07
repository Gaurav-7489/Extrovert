import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShopProduct, type ShopProduct } from "@/lib/shop";

export const dynamic = "force-dynamic";

type BillingPlan = "weekly" | "monthly";

// Authoritative server-side subscription prices. Never accept a client-supplied amount.
const SUBSCRIPTION_PRICES: Record<BillingPlan, number> = {
  weekly: 3900,
  monthly: 9900,
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !process.env.DATEBU_OWNER_ID || user.id !== process.env.DATEBU_OWNER_ID) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = String(body.paymentId || "");
    if (!paymentId) return NextResponse.json({ error: "Missing payment ID." }, { status: 400 });

    const admin = createAdminClient();
    const { data: payment, error } = await admin
      .from("upi_payment_submissions")
      .select("id,user_id,payment_type,product,amount_paise,status,metadata")
      .eq("id", paymentId)
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment submission not found." }, { status: 404 });
    }

    if (payment.status === "approved") {
      return NextResponse.json({ success: true, alreadyApproved: true });
    }

    // FIX #28: rejected payments are terminal. They cannot be approved or fulfilled later.
    if (payment.status === "rejected") {
      return NextResponse.json({ error: "Rejected payments cannot be approved. Ask the user to create a new payment request." }, { status: 409 });
    }

    if (payment.status !== "pending") {
      return NextResponse.json({ error: "Payment is not awaiting review." }, { status: 409 });
    }

    // FIX #22: the amount stored with a payment must match the authoritative
    // server-side price for the exact product before anything is fulfilled.
    // A manipulated client amount can therefore never be approved.
    let expectedAmountPaise: number | null = null;

    if (payment.payment_type === "shop") {
      const product = getShopProduct(payment.product) as (ReturnType<typeof getShopProduct> & { amountPaise: number }) | null;
      if (!product) return NextResponse.json({ error: "Invalid shop product." }, { status: 400 });
      expectedAmountPaise = product.amountPaise;
    } else if (payment.payment_type === "subscription") {
      expectedAmountPaise = SUBSCRIPTION_PRICES[payment.product as BillingPlan] ?? null;
      if (expectedAmountPaise === null) {
        return NextResponse.json({ error: "Invalid subscription product." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid payment type." }, { status: 400 });
    }

    if (payment.amount_paise !== expectedAmountPaise) {
      console.error("UPI payment amount mismatch:", {
        paymentId: payment.id,
        product: payment.product,
        submittedAmountPaise: payment.amount_paise,
        expectedAmountPaise,
      });
      return NextResponse.json(
        { error: "Payment amount does not match the server price. Payment cannot be approved." },
        { status: 409 },
      );
    }

    if (payment.payment_type === "shop") {
      const shopOrderId = String((payment.metadata as { shop_order_id?: string } | null)?.shop_order_id || "");
      if (!shopOrderId) return NextResponse.json({ error: "Shop order reference is missing." }, { status: 400 });

      // The order is also checked against its own authoritative product price
      // so approval cannot fulfill an order whose amount was tampered with.
      const { data: order, error: orderError } = await admin
        .from("shop_orders")
        .select("id,product,amount_paise,status")
        .eq("id", shopOrderId)
        .maybeSingle();

      if (orderError || !order) return NextResponse.json({ error: "Shop order not found." }, { status: 404 });
      const orderProduct = getShopProduct(order.product as ShopProduct);
      if (!orderProduct || order.amount_paise !== orderProduct.amountPaise || order.product !== payment.product) {
        console.error("UPI shop order amount/product mismatch:", {
          paymentId: payment.id,
          shopOrderId,
          paymentProduct: payment.product,
          orderProduct: order.product,
          orderAmountPaise: order.amount_paise,
          expectedAmountPaise,
        });
        return NextResponse.json({ error: "Shop order does not match the server price. Payment cannot be approved." }, { status: 409 });
      }

      const { error: fulfillError } = await admin.rpc("fulfill_shop_order", { p_order_id: shopOrderId });
      if (fulfillError) return NextResponse.json({ error: "Payment found, but shop fulfillment failed: " + fulfillError.message }, { status: 500 });

      // Shop fulfillment does not touch subscription state, so its payment can
      // be marked approved after successful fulfillment.
      const { error: markError } = await admin
        .from("upi_payment_submissions")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", paymentId)
        .eq("status", "pending");

      if (markError) throw markError;
    } else {
      // FIX #31: subscription activation is performed only by a trusted DB
      // transaction that first validates and marks this exact payment approved.
      // Payment approval and Pro activation commit together, so activation can
      // never persist for an unapproved/invalid payment.
      const { data: result, error: subscriptionError } = await admin.rpc("approve_subscription_payment", {
        p_payment_id: paymentId,
      });

      if (subscriptionError) {
        console.error("UPI subscription approval/activation failed:", subscriptionError);
        return NextResponse.json({ error: "Payment found, but membership activation failed." }, { status: 500 });
      }

      if (!result?.success) {
        return NextResponse.json({ error: "Payment could not be approved." }, { status: 409 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPI payment approval failed:", error);
    return NextResponse.json({ error: "Unable to approve payment." }, { status: 500 });
  }
}