import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { binanceApiEnabled, ensurePaymentSchema, parseJsonArray } from '@/lib/payments';
import { createBinanceOrder } from '@/lib/binancePay';

// POST { orderId } — creates the Binance Pay order and returns the hosted checkout URL.
export async function POST(req: NextRequest) {
  if (!binanceApiEnabled()) return NextResponse.json({ error: 'Binance Pay no configurado' }, { status: 503 });

  const { orderId } = (await req.json()) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  await ensurePaymentSchema();
  const rows = await sql`SELECT id, total, payment_status, payment_methods FROM orders WHERE id = ${orderId}`;
  const order = rows[0];
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const methods = parseJsonArray<{ method: string }>(order.payment_methods);
  if (methods[0]?.method !== 'binance' || order.payment_status !== 'awaiting_payment') {
    return NextResponse.json({ error: 'El pedido no espera un pago con Binance Pay' }, { status: 409 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  try {
    const checkout = await createBinanceOrder({ orderId: order.id as string, totalUsd: Number(order.total), origin });
    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, universalUrl: checkout.universalUrl });
  } catch (e) {
    console.error('[binance/create]', e);
    return NextResponse.json({ error: 'No se pudo iniciar el pago con Binance Pay' }, { status: 502 });
  }
}
