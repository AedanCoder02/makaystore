import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS walk_in_clients (
      id TEXT PRIMARY KEY DEFAULT CONCAT('wic_', gen_random_uuid()::text),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      date_of_birth DATE,
      address TEXT,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();

  const [clerkResult, walkIns] = await Promise.all([
    clerkClient().then(c => c.users.getUserList({ limit: 200, orderBy: '-created_at' })).catch(() => ({ data: [] })),
    sql`SELECT id, name, email, phone FROM walk_in_clients ORDER BY created_at DESC LIMIT 200`.catch(() => [] as unknown[]),
  ]);

  const clerkCustomers = ((clerkResult as { data: unknown[] }).data ?? [])
    .filter((u: unknown) => {
      const user = u as { publicMetadata?: { role?: string } };
      const role = user.publicMetadata?.role;
      return !role || role === 'customer';
    })
    .map((u: unknown) => {
      const user = u as {
        id: string;
        firstName?: string;
        lastName?: string;
        emailAddresses: { emailAddress: string }[];
        imageUrl: string;
      };
      return {
        id: user.id,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Customer',
        email: user.emailAddresses[0]?.emailAddress ?? '',
        imageUrl: user.imageUrl,
        isWalkIn: false,
      };
    });

  const walkInCustomers = (walkIns as { id: string; name: string; email: string | null }[]).map(w => ({
    id: w.id,
    name: w.name,
    email: w.email ?? '',
    imageUrl: '',
    isWalkIn: true,
  }));

  return NextResponse.json([...clerkCustomers, ...walkInCustomers]);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, phone, date_of_birth, address } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

  await ensureTable();

  const rows = await sql`
    INSERT INTO walk_in_clients (name, email, phone, date_of_birth, address, created_by)
    VALUES (
      ${name.trim()},
      ${email?.trim() || null},
      ${phone?.trim() || null},
      ${date_of_birth || null},
      ${address?.trim() || null},
      ${userId}
    )
    RETURNING id, name, email, phone
  `;

  const client = rows[0] as { id: string; name: string; email: string | null; phone: string | null };
  return NextResponse.json({
    id: client.id,
    name: client.name,
    email: client.email ?? '',
    imageUrl: '',
    isWalkIn: true,
  });
}
