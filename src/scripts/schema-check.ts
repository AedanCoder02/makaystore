import sql from '../lib/db';

async function main() {
  const overrides = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'product_overrides' ORDER BY ordinal_position
  `;
  console.log('product_overrides columns:', overrides.map((r: any) => `${r.column_name}(${r.data_type})`).join(', '));

  const stock = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'product_stock' ORDER BY ordinal_position
  `;
  console.log('product_stock columns:', stock.map((r: any) => `${r.column_name}(${r.data_type})`).join(', '));

  const sample = await sql`SELECT * FROM product_overrides LIMIT 2`;
  console.log('sample overrides:', JSON.stringify(sample));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
