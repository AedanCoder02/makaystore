import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Merge storefront orders + in-person seller_orders
    const [sellerOrders, storefrontOrders] = await Promise.all([
      sql`SELECT id, seller_id, client_name, subtotal, items, payment_method, created_at, 'in-person' AS source FROM seller_orders ORDER BY created_at DESC LIMIT 300`,
      sql`SELECT id, customer_id AS seller_id, customer_email AS client_name, total AS subtotal, items, shipping_method AS payment_method, created_at, 'storefront' AS source FROM orders ORDER BY created_at DESC LIMIT 300`.catch(() => []),
    ]);
    const orders = [...sellerOrders, ...(storefrontOrders as any[])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 300);

    // Collect unique seller IDs and look them up in Clerk
    const sellerIds = [...new Set(orders.map((o: any) => o.seller_id).filter(Boolean))];
    const sellerNames: Record<string, string> = {};

    await Promise.all(
      sellerIds.map(async (id) => {
        try {
          const user = await (await clerkClient()).users.getUser(id as string);
          sellerNames[id as string] = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress || id as string;
        } catch {
          sellerNames[id as string] = id as string;
        }
      })
    );

    const result = orders.map((o: any) => ({
      ...o,
      seller_name: sellerNames[o.seller_id] ?? o.seller_id,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items ?? []),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
