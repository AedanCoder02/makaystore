import sql from '@/lib/db';
import SellerStock from '@/components/seller/SellerStock';

export const metadata = { title: 'Stock — Seller' };

export default async function SellerStockPage() {
  const [dbProducts, stockRows] = await Promise.all([
    sql`SELECT * FROM products WHERE status = 'active' ORDER BY CAST(id AS integer)`,
    sql`SELECT * FROM product_stock`,
  ]);
  const stockMap = Object.fromEntries(stockRows.map((s: any) => [s.product_id, Number(s.quantity)]));

  const products = dbProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    category: p.category,
    defaultStock: Number(p.stock),
    currentStock: stockMap[p.id] ?? Number(p.stock),
  }));

  return <SellerStock products={products} />;
}
