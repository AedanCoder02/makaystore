import sql from '@/lib/db';
import SellerSell from '@/components/seller/SellerSell';

export const metadata = { title: 'Sell — Seller' };

export default async function SellerSellPage() {
  const [dbProducts, overrides] = await Promise.all([
    sql`SELECT * FROM products WHERE status = 'active' ORDER BY id`,
    sql`SELECT * FROM product_overrides`,
  ]);
  const overrideMap = Object.fromEntries(overrides.map((o: any) => [o.product_id, o]));

  const products = dbProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    price: overrideMap[p.id]?.price ? Number(overrideMap[p.id].price) : Number(p.price),
    image: overrideMap[p.id]?.image_url || p.image,
    category: p.category,
    productType: (overrideMap[p.id]?.product_type ?? 'storefront') as 'storefront' | 'dropshipping',
  }));

  return <SellerSell products={products} />;
}
