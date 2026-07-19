import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, price, description, image, sku, stock, category, status, sizes, colors } = body;

  if (!title || price === undefined) {
    return NextResponse.json({ error: 'title and price required' }, { status: 400 });
  }

  const row = await sql`
    UPDATE products SET
      title       = ${title},
      description = ${description ?? ''},
      price       = ${price},
      image       = ${image ?? ''},
      sku         = ${sku ?? ''},
      stock       = ${Number(stock ?? 0)},
      category    = ${category ?? ''},
      status      = ${status ?? 'active'},
      sizes       = ${sizes ?? []},
      colors      = ${JSON.stringify(colors ?? [])},
      updated_at  = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!row[0]) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Keep product_overrides in sync so storefront COALESCE picks up the new price/image/description
  await sql`
    UPDATE product_overrides
    SET price       = ${price},
        image_url   = ${image ?? ''},
        description = ${description ?? ''},
        updated_at  = NOW()
    WHERE product_id = ${id}
  `.catch(() => {});

  return NextResponse.json(row[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM products WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
