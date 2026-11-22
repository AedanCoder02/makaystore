import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePaymentSchema, getStaffRole } from '@/lib/payments';

// GET — payment proof file. Visible to staff and to the customer who owns the order. Never public.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await ensurePaymentSchema();
  const rows = await sql`
    SELECT p.mime, p.filename, p.data, o.customer_id
    FROM payment_proofs p JOIN orders o ON o.id = p.order_id
    WHERE p.id = ${id}
  `;
  const proof = rows[0];
  if (!proof) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (proof.customer_id !== userId && !(await getStaffRole())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filename = String(proof.filename ?? 'comprobante').replace(/[^\w.\-]/g, '_');
  return new NextResponse(new Uint8Array(proof.data as Buffer), {
    headers: {
      'Content-Type': proof.mime as string,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
