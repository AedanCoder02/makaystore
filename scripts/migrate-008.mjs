import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// Authorized users per membership (up to 3 per member, admin-only)
await sql.unsafe(`
  CREATE TABLE IF NOT EXISTS membership_authorized_users (
    id           SERIAL PRIMARY KEY,
    member_clerk_id TEXT NOT NULL,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  );
`);
await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_mau_clerk ON membership_authorized_users(member_clerk_id);`);
console.log('membership_authorized_users table ready');

await sql.end();
console.log('Migration 008 complete');
