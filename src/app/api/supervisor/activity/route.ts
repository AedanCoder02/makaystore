import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT id, seller_id, type, note, status, created_at
    FROM activities
    ORDER BY created_at DESC
    LIMIT 30
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

  const events = rows.map((r) => ({
    id: String(r.id),
    workerId: r.seller_id,
    workerName: nameMap[r.seller_id as string] ?? 'Seller',
    action: r.type === 'clock-in' ? 'clocked in' : r.type === 'clock-out' ? 'clocked out' : String(r.type),
    status: r.status,
    timestamp: r.created_at,
  }));

  return NextResponse.json(events);
}
