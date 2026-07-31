import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const method = searchParams.get('method');
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  // Storefront orders with payment_methods
  let storefrontRows = await sql`
    SELECT
      id, customer_id, customer_email, total, subtotal, shipping_cost,
      items, status, shipping_method, payment_id,
      payment_methods, created_at, 'storefront' AS source
    FROM orders
    ORDER BY created_at DESC
    LIMIT 500
  `.catch(() => [] as unknown[]);

  // In-person seller orders
  let sellerRows = await sql`
    SELECT
      id::text, seller_id AS customer_id, client_name AS customer_email,
      subtotal AS total, subtotal, 0 AS shipping_cost,
      items, 'completed' AS status, payment_method AS shipping_method, '' AS payment_id,
      '[]'::jsonb AS payment_methods, created_at, 'in-person' AS source
    FROM seller_orders
    ORDER BY created_at DESC
    LIMIT 500
  `.catch(() => [] as unknown[]);

  type OrderRow = {
    id: string; customer_id: string; customer_email: string; total: number;
    subtotal: number; shipping_cost: number; items: unknown; status: string;
    shipping_method: string; payment_id: string;
    payment_methods: { method?: string; amount: number; receipt_url?: string }[];
    created_at: string; source: string;
  };

  let rows: OrderRow[] = ([...(storefrontRows as OrderRow[]), ...(sellerRows as OrderRow[])])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 500);

  // Apply filters
  if (from) rows = rows.filter(r => new Date(r.created_at) >= new Date(from));
  if (to)   rows = rows.filter(r => new Date(r.created_at) <= new Date(to + 'T23:59:59'));
  if (method) {
    rows = rows.filter(r => {
      const pms = Array.isArray(r.payment_methods) ? r.payment_methods : [];
      return pms.some(p => p.method === method) || r.shipping_method === method;
    });
  }

  const result = rows.map(r => ({
    ...r,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items ?? []),
    payment_methods: typeof r.payment_methods === 'string' ? JSON.parse(r.payment_methods) : (r.payment_methods ?? []),
  }));

  return NextResponse.json(result);
}
