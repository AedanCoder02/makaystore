import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

await sql.unsafe(`
  -- Wallet configuration (singleton row)
  CREATE TABLE IF NOT EXISTS wallet_config (
    id INT PRIMARY KEY DEFAULT 1,
    pts_per_dollar INT NOT NULL DEFAULT 10,
    default_credit_interest DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  INSERT INTO wallet_config (id, pts_per_dollar, default_credit_interest)
  VALUES (1, 10, 0.05) ON CONFLICT DO NOTHING;

  -- Credit lines issued by admin to users
  CREATE TABLE IF NOT EXISTS credit_lines (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    principal DECIMAL(10,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Dollar balance on user profiles
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS dollar_balance DECIMAL(10,2) DEFAULT 0;
`);

await sql.end();
console.log('Migration 005 done — wallet_config, credit_lines, dollar_balance column added.');
