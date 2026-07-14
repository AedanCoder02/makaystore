import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET all product overrides
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`SELECT * FROM product_overrides ORDER BY updated_at DESC`;
  return NextResponse.json(rows);
}

// POST — add a brand-new custom product
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { product_id, price, description, image_url, product_type } = body;

  if (!product_id || !price) {
    return NextResponse.json({ error: 'product_id and price required' }, { status: 400 });
  }

  const row = await sql`
    INSERT INTO product_overrides (product_id, price, description, image_url, product_type, updated_by)
    VALUES (${product_id}, ${price}, ${description ?? ''}, ${image_url ?? ''}, ${product_type ?? 'storefront'}, ${userId})
    ON CONFLICT (product_id) DO UPDATE
    SET price = EXCLUDED.price,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        product_type = EXCLUDED.product_type,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json(row[0]);
}
