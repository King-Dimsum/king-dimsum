import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return NextResponse.json({ error: "Gateway not configured" }, { status: 503 });

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, transaction_id } = notification;
    const expected = createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");
    if (typeof signature_key !== "string" || expected !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const db = supabaseAdmin();
    const { data: order, error } = await db.from("coin_orders")
      .select("order_id, amount_idr, status")
      .eq("order_id", order_id).single();
    if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Jangan kredit pending/deny/expire. Pembayaran sukses: settlement atau capture yang diterima.
    const paid = transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");
    if (paid) {
      if (Number(gross_amount) !== Number(order.amount_idr).toFixed(2) &&
          Number(gross_amount) !== Number(order.amount_idr)) {
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }
      const { error: fulfillError } = await db.rpc("fulfill_coin_order", {
        p_order_id: order_id,
        p_provider_transaction_id: String(transaction_id ?? "")
      });
      if (fulfillError) throw fulfillError;
    } else if (["expire", "cancel", "deny"].includes(transaction_status)) {
      await db.from("coin_orders").update({ status: transaction_status }).eq("order_id", order_id).eq("status", "pending");
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("midtrans notification error", error);
    return NextResponse.json({ error: "Notification processing failed" }, { status: 500 });
 
  }
}
