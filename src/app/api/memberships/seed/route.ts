import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

const MEMBERSHIP_PRODUCTS = [
  {
    id: 'membership-bronze',
    title: 'Bronze Club Membership',
    description: 'Entry-level beach club membership. Early drop access to new collections and 5% credit back on every purchase.',
    price: 49.00,
    sku: 'MEM-BRONZE',
    category: 'membership',
    image: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025011_3811970f-3e59-49fb-9c36-e9d66f33d8ad.png',
    stock: 9999,
  },
  {
    id: 'membership-silver',
    title: 'Silver Club Membership',
    description: 'Priority event tickets, 10% credit back on every purchase, and all Bronze perks included.',
    price: 99.00,
    sku: 'MEM-SILVER',
    category: 'membership',
    image: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025018_a90c7985-632b-45b3-af61-3982b4a580e6.png',
    stock: 9999,
  },
  {
    id: 'membership-gold',
    title: 'Gold Club Membership',
    description: 'VIP event access, personal stylist, 15% credit back, and all Silver perks. The ultimate Makay experience.',
    price: 199.00,
    sku: 'MEM-GOLD',
    category: 'membership',
    image: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025024_d50b049e-ae8b-481e-a3d8-e015ab48c01c.png',
    stock: 9999,
  },
];

// POST /api/memberships/seed — admin only, idempotent
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'`;

  const results = [];
  for (const p of MEMBERSHIP_PRODUCTS) {
    const row = await sql`
      INSERT INTO products (id, title, description, price, image, sku, category, stock, status, variants, sizes, colors)
      VALUES (${p.id}, ${p.title}, ${p.description}, ${p.price}, ${p.image}, ${p.sku}, ${p.category}, ${p.stock}, 'active', '[]', '{}', '[]')
      ON CONFLICT (id) DO UPDATE SET
        title       = EXCLUDED.title,
        description = EXCLUDED.description,
        price       = EXCLUDED.price,
        image       = EXCLUDED.image,
        updated_at  = NOW()
      RETURNING id, title, price
    `;
    results.push(row[0]);
  }

  return NextResponse.json({ seeded: results });
}
