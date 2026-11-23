import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

await sql.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'guacuco';`);
await sql.unsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'guacuco';`);
await sql.unsafe(`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'guacuco';`);

await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);`);
await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);`);
await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_seller_orders_location ON seller_orders(location);`);

console.log('products/orders/seller_orders.location columns ready, backfilled to guacuco');

await sql.end();
console.log('Migration 009 complete');
