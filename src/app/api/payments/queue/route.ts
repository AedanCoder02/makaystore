import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePaymentSchema, getStaffRole, parseJsonArray } from '@/lib/payments';

const STATUSES = ['pending_verification', 'verified', 'rejected'] as const;

// GET — storefront orders paid with manual methods, for staff review.
export async function GET(req: NextRequest) {
  if (!(await getStaffRole())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') ?? 'pending_verification';
  if (!(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  await ensurePaymentSchema();
  const rows = await sql`
    SELECT id, customer_id, customer_email, items, total, shipping_address, status,
           payment_methods, payment_status, payment_verified_by, payment_verified_at,
           payment_note, created_at
    FROM orders
    WHERE payment_status = ${status}
    ORDER BY created_at ${status === 'pending_verification' ? sql`ASC` : sql`DESC`}
    LIMIT 200
  `;

  const counts = await sql`
    SELECT payment_status, COUNT(*)::int AS n FROM orders
    WHERE payment_status IN ('pending_verification', 'verified', 'rejected')
    GROUP BY payment_status
  `;

  const ids = rows.map(r => r.id as string);
  const proofs = ids.length
    ? await sql`SELECT id, mime FROM payment_proofs WHERE order_id = ANY(${ids})`
    : [];
  const proofMime = Object.fromEntries(proofs.map(p => [p.id, p.mime]));

  return NextResponse.json({
    proof_mime: proofMime,
    orders: rows.map(r => ({
      ...r,
      items: parseJsonArray(r.items),
      payment_methods: parseJsonArray(r.payment_methods),
      shipping_address: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : (r.shipping_address ?? {}),
    })),
    counts: Object.fromEntries(counts.map(c => [c.payment_status, c.n])),
  });
}
