import sql from '../lib/db';
import { mockProducts } from '../lib/mockData';

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const p of mockProducts) {
    const variantsJson = JSON.stringify(p.variants);
    const result = await sql`
      INSERT INTO products (id, title, description, price, image, sku, stock, category, variants, status)
      VALUES (${p.id}, ${p.title}, ${p.description}, ${p.price}, ${p.image}, ${p.sku}, ${p.stock}, ${p.category}, ${variantsJson}::jsonb, 'active')
      ON CONFLICT (id) DO NOTHING
    `;
    if (result.count === 0) skipped++;
    else inserted++;
  }

  console.log(`Seeded: ${inserted} inserted, ${skipped} already existed`);
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
