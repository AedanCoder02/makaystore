import sql from '@/lib/db';
import SellerProducts from '@/components/seller/SellerProducts';

export const metadata = { title: 'Products — Seller' };

export default async function SellerProductsPage() {
  const [dbProducts, overrides] = await Promise.all([
    sql`SELECT * FROM products WHERE status = 'active' ORDER BY CAST(id AS integer)`,
    sql`SELECT * FROM product_overrides`,
  ]);
  const overrideMap = Object.fromEntries(overrides.map((o: any) => [o.product_id, o]));

  const merged = dbProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: overrideMap[p.id]?.description || p.description,
    price: overrideMap[p.id]?.price ? Number(overrideMap[p.id].price) : Number(p.price),
    image: overrideMap[p.id]?.image_url || p.image,
    sku: p.sku,
    stock: Number(p.stock),
    category: p.category,
    variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants ?? []),
    productType: overrideMap[p.id]?.product_type ?? 'storefront',
    hasOverride: !!overrideMap[p.id],
  }));

  return <SellerProducts products={merged} />;
}
