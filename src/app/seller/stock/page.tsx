import sql from '@/lib/db';
import { mockProducts } from '@/lib/mockData';
import SellerStock from '@/components/seller/SellerStock';

export const metadata = { title: 'Stock — Seller' };

export default async function SellerStockPage() {
  const stockRows = await sql`SELECT * FROM product_stock`;
  const stockMap = Object.fromEntries(stockRows.map((s: any) => [s.product_id, Number(s.quantity)]));

  const products = mockProducts.map(p => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    category: p.category,
    defaultStock: p.stock,
    currentStock: stockMap[p.id] ?? p.stock,
  }));

  return <SellerStock products={products} />;
}
