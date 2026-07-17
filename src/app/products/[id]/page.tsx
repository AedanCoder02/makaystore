import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import ProductDetail from '@/components/ProductDetail';

type Params = Promise<{ id: string }>;

export default async function ProductPage(props: { params: Params }) {
  const { id } = await props.params;

  const rows = await sql`
    SELECT
      p.id, p.title, p.description, p.category, p.variants, p.sku, p.status,
      COALESCE(po.price, p.price)::numeric AS price,
      COALESCE(po.image_url, p.image) AS image,
      COALESCE(po.product_type, 'storefront') AS product_type,
      COALESCE(SUM(ps.quantity), p.stock)::int AS stock
    FROM products p
    LEFT JOIN product_overrides po ON po.product_id = p.id
    LEFT JOIN product_stock ps ON ps.product_id = p.id
    WHERE p.id = ${id} AND p.status = 'active'
    GROUP BY p.id, p.title, p.description, p.category, p.variants, p.sku, p.status,
             po.price, po.image_url, po.product_type
    LIMIT 1
  `;

  if (!rows.length) notFound();

  const r = rows[0] as any;
  const product = {
    ...r,
    variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : (r.variants ?? []),
    price: parseFloat(r.price),
    stock: Number(r.stock),
  };

  return <ProductDetail product={product} />;
}
