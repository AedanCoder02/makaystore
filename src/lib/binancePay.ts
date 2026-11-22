import crypto from 'node:crypto';
import sql from '@/lib/db';
import { markOrderPaid } from '@/lib/orderFulfillment';

// Binance Pay merchant API. Docs: https://developers.binance.com/en/docs/products/binance-pay-merchant/api-common
const HOST = 'https://bpay.binanceapi.com';

interface BinanceResponse<T> {
  status: 'SUCCESS' | 'FAIL';
  code: string;
  data?: T;
  errorMessage?: string;
}

function nonce(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(32);
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function binanceRequest<T>(path: string, payload: Record<string, unknown>): Promise<BinanceResponse<T>> {
  const apiKey = process.env.BINANCE_PAY_API_KEY;
  const secret = process.env.BINANCE_PAY_SECRET_KEY;
  if (!apiKey || !secret) throw new Error('Binance Pay is not configured');

  const body = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const n = nonce();
  const signature = crypto
    .createHmac('sha512', secret)
    .update(`${timestamp}\n${n}\n${body}\n`)
    .digest('hex')
    .toUpperCase();

  const res = await fetch(`${HOST}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Nonce': n,
      'BinancePay-Certificate-SN': apiKey,
      'BinancePay-Signature': signature,
    },
    body,
    cache: 'no-store',
  });
  return (await res.json()) as BinanceResponse<T>;
}

/** Binance only accepts letters and digits, max 32 chars. */
export function toMerchantTradeNo(orderId: string): string {
  return orderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 32);
}

export interface BinanceCheckout {
  prepayId: string;
  checkoutUrl: string;
  universalUrl: string;
  deeplink: string;
  qrcodeLink: string;
  expireTime: number;
}

export async function createBinanceOrder(params: {
  orderId: string;
  totalUsd: number;
  origin: string;
}): Promise<BinanceCheckout> {
  const merchantTradeNo = toMerchantTradeNo(params.orderId);
  const res = await binanceRequest<BinanceCheckout>('/binancepay/openapi/v3/order', {
    env: { terminalType: 'WEB' },
    merchantTradeNo,
    // Fiat order: Binance converts USD to USDT/USDC at market rate.
    fiatAmount: Number(params.totalUsd.toFixed(2)),
    fiatCurrency: 'USD',
    description: `Makay Guacuco ${params.orderId}`,
    goodsDetails: [{
      goodsType: '02',
      goodsCategory: 'Z000',
      referenceGoodsId: merchantTradeNo,
      goodsName: `Makay order ${merchantTradeNo}`,
    }],
    returnUrl: `${params.origin}/order-confirmation/${params.orderId}`,
    cancelUrl: `${params.origin}/checkout`,
    webhookUrl: `${params.origin}/api/webhooks/binance`,
    orderExpireTime: 60 * 60 * 1000,
  });
  if (res.status !== 'SUCCESS' || !res.data) {
    throw new Error(`Binance Pay: ${res.errorMessage || res.code}`);
  }
  await sql`
    UPDATE orders SET payment_provider_ref = ${merchantTradeNo}, updated_at = NOW()
    WHERE id = ${params.orderId}
  `;
  return res.data;
}

interface BinanceQuery {
  merchantTradeNo: string;
  prepayId: string;
  transactionId?: string;
  status: 'INITIAL' | 'PENDING' | 'PAID' | 'CANCELED' | 'ERROR' | 'REFUNDING' | 'REFUNDED' | 'FULL_REFUNDED' | 'EXPIRED';
}

/**
 * Asks Binance for the order's real status (never trusts a webhook body or redirect)
 * and marks the order paid when Binance says PAID.
 */
export async function syncBinanceOrder(orderId: string): Promise<string | null> {
  const rows = await sql`SELECT payment_provider_ref, payment_status FROM orders WHERE id = ${orderId}`;
  const ref = rows[0]?.payment_provider_ref as string | undefined;
  if (!ref || rows[0]?.payment_status !== 'awaiting_payment') return (rows[0]?.payment_status as string) ?? null;

  const res = await binanceRequest<BinanceQuery>('/binancepay/openapi/v2/order/query', { merchantTradeNo: ref });
  if (res.status !== 'SUCCESS' || !res.data) return 'awaiting_payment';
  if (res.data.status === 'PAID' && res.data.merchantTradeNo === ref) {
    await markOrderPaid(orderId, res.data.transactionId || res.data.prepayId);
    return 'paid';
  }
  return 'awaiting_payment';
}
