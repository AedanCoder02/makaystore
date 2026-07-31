import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// user_profiles — membership subscription columns
await sql.unsafe(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMPTZ;`);
await sql.unsafe(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMPTZ;`);
await sql.unsafe(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS membership_duration VARCHAR(20) CHECK (membership_duration IN ('trimestral', 'semestral', 'anual'));`);
console.log('user_profiles membership columns ready');

// orders — payment methods JSONB
await sql.unsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]';`);
console.log('orders.payment_methods ready');

// products — markup + commission columns
await sql.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS markup_percent BOOLEAN DEFAULT false;`);
await sql.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS markup_amount DECIMAL(10,2) DEFAULT 0;`);
await sql.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_commission DECIMAL(10,2) DEFAULT 0;`);
console.log('products markup/commission columns ready');

// damage reports table
await sql.unsafe(`
  CREATE TABLE IF NOT EXISTS product_damage_reports (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    type VARCHAR(20) NOT NULL CHECK (type IN ('damaged', 'lost')),
    description TEXT,
    destination TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('product_damage_reports table ready');

await sql.end();
console.log('Migration 007 complete');
