import sql from '@/lib/db';
import { mockProducts } from '@/lib/mockData';
import SellerProducts from '@/components/seller/SellerProducts';

export const metadata = { title: 'Products — Seller' };

export default async function SellerProductsPage() {
  const overrides = await sql`SELECT * FROM product_overrides`;
  const overrideMap = Object.fromEntries(overrides.map((o: any) => [o.product_id, o]));

  const merged = mockProducts.map(p => ({
    ...p,
    price: overrideMap[p.id]?.price ? Number(overrideMap[p.id].price) : p.price,
    description: overrideMap[p.id]?.description || p.description,
    image: overrideMap[p.id]?.image_url || p.image,
    productType: overrideMap[p.id]?.product_type ?? 'storefront',
    hasOverride: !!overrideMap[p.id],
  }));

  return <SellerProducts products={merged} />;
}
