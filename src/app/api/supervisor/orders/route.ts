import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const method   = searchParams.get('method');
  const from     = searchParams.get('from');
  const to       = searchParams.get('to');
  const giftOnly = searchParams.get('gift') === 'true';

  try {
    const [sellerRaw, storefrontRaw] = await Promise.all([
      sql`SELECT * FROM seller_orders ORDER BY created_at DESC LIMIT 500`,
      sql`
        SELECT id, customer_id, customer_email, total AS subtotal, shipping_cost,
               items, status, shipping_method, payment_methods, created_at
        FROM orders
        ORDER BY created_at DESC LIMIT 500
      `.catch(() => []),
    ]);

    const parseJson = (v: unknown): unknown[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return [];
    };

    type OrderRow = {
      id: string; customer_id?: string; customer_email?: string; client_name?: string;
      total?: number; subtotal?: number; shipping_cost?: number; items: unknown;
      status?: string; shipping_method?: string; payment_id?: string;
      payment_methods: unknown; created_at: unknown; source: string; is_gift: boolean;
      payment_confirmed?: boolean;
    };

    const sellerRows: OrderRow[] = (sellerRaw as Record<string, unknown>[]).map(r => ({
      id:               String(r.id ?? ''),
      customer_id:      String(r.seller_id ?? ''),
      customer_email:   String(r.client_email ?? ''),
      client_name:      String(r.client_name ?? ''),
      total:            Number(r.subtotal ?? 0),
      subtotal:         Number(r.subtotal ?? 0),
      shipping_cost:    0,
      items:            r.items,
      status:           'completed',
      shipping_method:  '',
      payment_id:       '',
      payment_methods:   r.payment_method ?? r.payment_methods ?? [],
      created_at:        r.created_at,
      source:            'in-person',
      is_gift:           Boolean(r.is_gift ?? false),
      payment_confirmed: Boolean(r.payment_confirmed ?? false),
    }));

    const storefrontRows: OrderRow[] = (storefrontRaw as Record<string, unknown>[]).map(r => ({
      id:               String(r.id ?? ''),
      customer_id:      String(r.customer_id ?? ''),
      customer_email:   String(r.customer_email ?? ''),
      total:            Number(r.subtotal ?? r.total ?? 0),
      subtotal:         Number(r.subtotal ?? r.total ?? 0),
      shipping_cost:    Number(r.shipping_cost ?? 0),
      items:            r.items,
      status:           String(r.status ?? 'placed'),
      shipping_method:  String(r.shipping_method ?? ''),
      payment_id:       '',
      payment_methods:  r.payment_methods ?? [],
      created_at:       r.created_at,
      source:           'storefront',
      is_gift:          false,
    }));

    let rows = [...sellerRows, ...storefrontRows]
      .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())
      .slice(0, 500);

    if (from)     rows = rows.filter(r => new Date(String(r.created_at)) >= new Date(from));
    if (to)       rows = rows.filter(r => new Date(String(r.created_at)) <= new Date(to + 'T23:59:59'));
    if (giftOnly) rows = rows.filter(r => r.is_gift);
    if (method) {
      rows = rows.filter(r => {
        const pms = parseJson(r.payment_methods) as { method?: string }[];
        return pms.some(p => p.method === method) || r.shipping_method === method;
      });
    }

    const result = rows.map(r => ({
      ...r,
      customer_name: r.client_name || undefined,
      items:           parseJson(r.items),
      payment_methods: parseJson(r.payment_methods),
    }));

    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error)?.message ?? 'DB error';
    console.error('[supervisor/orders]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
