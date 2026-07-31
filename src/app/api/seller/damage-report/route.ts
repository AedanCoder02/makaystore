import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT dr.*, p.title AS product_title
    FROM product_damage_reports dr
    LEFT JOIN products p ON p.id = dr.product_id
    ORDER BY dr.created_at DESC
    LIMIT 200
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { product_id, quantity, type, description, destination, receipt_url } = body;

  if (!product_id || !type || !['damaged', 'lost'].includes(type)) {
    return NextResponse.json({ error: 'product_id and valid type required' }, { status: 400 });
  }

  const row = await sql`
    INSERT INTO product_damage_reports (product_id, reported_by, quantity, type, description, destination, receipt_url)
    VALUES (
      ${product_id},
      ${userId},
      ${Number(quantity ?? 1)},
      ${type},
      ${description ?? ''},
      ${destination ?? ''},
      ${receipt_url ?? ''}
    )
    RETURNING *
  `;

  return NextResponse.json(row[0], { status: 201 });
}
