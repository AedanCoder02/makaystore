import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePaymentSchema, getStaffRole } from '@/lib/payments';
import { fulfillOrder } from '@/lib/orderFulfillment';

// PATCH — staff (seller / supervisor / admin) verify or reject a manual payment proof.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffRole();
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action, note } = (await req.json()) as { action?: string; note?: string };
  if (action !== 'verify' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be verify or reject' }, { status: 400 });
  }

  await ensurePaymentSchema();
  const nextPayment = action === 'verify' ? 'verified' : 'rejected';
  const nextStatus = action === 'verify' ? 'confirmed' : 'cancelled';

  const rows = await sql`
    UPDATE orders
    SET payment_status = ${nextPayment},
        status = ${nextStatus},
        payment_verified_by = ${staff.userId},
        payment_verified_at = NOW(),
        payment_note = ${String(note ?? '').slice(0, 500) || null},
        updated_at = NOW()
    WHERE id = ${id} AND payment_status = 'pending_verification'
    RETURNING id, status, payment_status, payment_verified_at, payment_note
  `;
  if (!rows[0]) {
    return NextResponse.json({ error: 'El pedido no está pendiente de verificación' }, { status: 409 });
  }

  if (action === 'verify') await fulfillOrder(id);

  return NextResponse.json(rows[0]);
}
