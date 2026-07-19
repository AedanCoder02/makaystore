import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureColumns() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'`;
}

// GET — all products (all statuses) for seller panel
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureColumns();

  const rows = await sql`
    SELECT id, title, description, price, image, sku, stock, category, status,
           sizes, colors, variants, created_at, updated_at
    FROM products
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

// POST — create a new product in the products table
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureColumns();

  const body = await req.json();
  const { title, price, description, image, sku, stock, category, status, sizes, colors } = body;

  if (!title || price === undefined) {
    return NextResponse.json({ error: 'title and price required' }, { status: 400 });
  }

  const id = `custom-${Date.now()}`;
  const row = await sql`
    INSERT INTO products (id, title, description, price, image, sku, stock, category, status, sizes, colors, variants)
    VALUES (
      ${id},
      ${title},
      ${description ?? ''},
      ${Number(price)},
      ${image ?? ''},
      ${sku ?? ''},
      ${Number(stock ?? 0)},
      ${category ?? ''},
      ${status ?? 'active'},
      ${sizes ?? []},
      ${JSON.stringify(colors ?? [])},
      '[]'
    )
    RETURNING *
  `;
  return NextResponse.json(row[0], { status: 201 });
}

// PATCH — bulk status update: { ids: string[], status: string }
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, status } = await req.json();
  if (!Array.isArray(ids) || !ids.length || !status) {
    return NextResponse.json({ error: 'ids[] and status required' }, { status: 400 });
  }
  const valid = ['active', 'paused', 'archived'];
  if (!valid.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 });

  await sql`
    UPDATE products
    SET status = ${status}, updated_at = NOW()
    WHERE id = ANY(${ids as string[]})
  `;
  return NextResponse.json({ ok: true, count: ids.length });
}
