import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePaymentSchema } from '@/lib/payments';
import { syncBinanceOrder } from '@/lib/binancePay';

// Binance Pay order notification. The body is only used to find the order; the status is
// re-read from Binance's signed query API, so a forged notification cannot mark anything paid.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { data?: string | { merchantTradeNo?: string } };
    const data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
    const ref = String(data?.merchantTradeNo ?? '').replace(/[^A-Za-z0-9]/g, '');
    if (ref) {
      await ensurePaymentSchema();
      const rows = await sql`SELECT id FROM orders WHERE payment_provider_ref = ${ref}`;
      if (rows[0]) await syncBinanceOrder(rows[0].id as string);
    }
  } catch (e) {
    console.error('[webhooks/binance]', e);
  }
  return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
}
