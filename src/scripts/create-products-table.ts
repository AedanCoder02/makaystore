import sql from '../lib/db';

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      price       NUMERIC(10,2) NOT NULL,
      image       TEXT,
      sku         TEXT,
      stock       INTEGER DEFAULT 0,
      category    TEXT,
      variants    JSONB DEFAULT '[]',
      status      TEXT DEFAULT 'active',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('products table created');
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
