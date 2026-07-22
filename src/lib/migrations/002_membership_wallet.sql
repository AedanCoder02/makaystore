-- membership tier config: global discount % per tier
CREATE TABLE IF NOT EXISTS membership_tier_config (
  tier TEXT PRIMARY KEY,
  discount_percent INT NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT DEFAULT ''
);

INSERT INTO membership_tier_config (tier, discount_percent, label, color, description) VALUES
  ('free',   0,  'Explorer', '#A89080', 'Default for all new members'),
  ('bronze', 5,  'Bronze',   '#CD7F32', 'Entry-level paid membership'),
  ('silver', 10, 'Silver',   '#A8A9AD', 'Mid-tier membership'),
  ('gold',   15, 'Gold',     '#D4AF37', 'Premium membership'),
  ('vip',    0,  'VIP',      '#D4A574', 'Exclusive invite-only tier')
ON CONFLICT (tier) DO NOTHING;

-- per-user discount override and points balance
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS discount_override INT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wallet_points INT NOT NULL DEFAULT 0;

-- wallet transaction log
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'admin_credit')),
  points INT NOT NULL,
  order_id TEXT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wallet_tx_user_idx ON wallet_transactions(user_id);
