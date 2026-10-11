import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sellerFilter = req.nextUrl.searchParams.get('seller') ?? '';
  const typeFilter   = req.nextUrl.searchParams.get('type') ?? '';

  const rows = await sql`
    SELECT id, seller_id, type, note, status, created_at
    FROM activities
    ORDER BY created_at DESC
    LIMIT 100
  `.catch(() => []);

  const sellerIds = [...new Set(rows.map((r) => r.seller_id as string))];
  const nameMap: Record<string, string> = {};
  if (sellerIds.length > 0) {
    const client = await clerkClient();
    await Promise.all(
      sellerIds.map(async (id) => {
        try {
          const u = await client.users.getUser(id);
          nameMap[id] = u.fullName ?? u.firstName ?? 'Seller';
        } catch {
          nameMap[id] = 'Seller';
        }
      })
    );
  }

  let events = rows.map((r) => ({
    id: String(r.id),
    workerId: String(r.seller_id ?? ''),
    workerName: nameMap[r.seller_id as string] ?? 'Seller',
    type: String(r.type ?? ''),
    action: r.type === 'clock-in' ? 'Entrada' : r.type === 'clock-out' ? 'Salida' : r.type === 'stock-update' ? 'Stock' : r.type === 'sale' ? 'Venta' : String(r.type),
    note: r.note ? String(r.note) : undefined,
    status: r.status,
    timestamp: r.created_at,
  }));

  if (sellerFilter) events = events.filter(e => e.workerId === sellerFilter);
  if (typeFilter)   events = events.filter(e => e.type === typeFilter);

  return NextResponse.json(events.slice(0, 50));
}
