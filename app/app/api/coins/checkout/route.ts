import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// Harga dan jumlah coin hanya ditentukan server. Jangan terima nominal dari browser.
const PACKAGES: Record<string, { coins: number; price: number; name: string }> = {
  coin_100: { coins: 100, price: 10000, name: "KING DIMSUM 100 Coin" },
  coin_550: { coins: 550, price: 50000, name: "KING DIMSUM 550 Coin" },
  coin_1200: { coins: 1200, price: 100000, name: "KING DIMSUM 1.200 Coin" },
  coin_2500: { coins: 2500, price: 200000, name: "KING DIMSUM 2.500 Coin" }
};

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

    const body = await req.json();
    const pack = PACKAGES[String(body.packageId)];
    if (!pack) return NextResponse.json({ error: "Paket koin tidak valid." }, { status: 400 });

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return NextResponse.json({ error: "Payment gateway belum dikonfigurasi." }, { status: 503 });

    const orderId = `KD-${crypto.randomUUID()}`;
    const db = supabaseAdmin();
    const { error: insertError } = await db.from("coin_orders").insert({
      order_id: orderId,
      user_id: user.id,
      package_id: String(body.packageId),
      coin_amount: pack.coins,
      amount_idr: pack.price,
      status: "pending"
    });
    if (insertError) throw insertError;

    const baseUrl = process.env.MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
    const enabledPayments = [
      "gopay", "ovo", "dana",
      "bca_va", "bni_va", "bri_va", "permata_va", "echannel"
    ];
    const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: pack.price },
        item_details: [{ id: String(body.packageId), price: pack.price, quantity: 1, name: pack.name }],
        customer_details: { email: user.email },
        enabled_payments: enabledPayments,
        callbacks: { finish: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/finish` }
      })
    });
    const result = await response.json();
    if (!response.ok || !result.token || !result.redirect_url) {
      await db.from("coin_orders").update({ status: "failed" }).eq("order_id", orderId);
      return NextResponse.json({ error: "Gateway gagal membuat transaksi.", detail: result }, { status: 502 })
      
      }
    const { error: updateError } = await db.from("coin_orders").update({
      midtrans_token: result.token,
      payment_url: result.redirect_url
    }).eq("order_id", orderId);
    if (updateError) throw updateError;

    return NextResponse.json({ orderId, token: result.token, redirectUrl: result.redirect_url });
  } catch (error) {
    console.error("coin checkout error", error);
    return NextResponse.json({ error: "Tidak dapat membuat transaksi." }, { status: 500 });
  }

}
