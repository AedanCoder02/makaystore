CREATE TABLE IF NOT EXISTS allies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  discount_percent INT NOT NULL DEFAULT 10,
  discount_code TEXT NOT NULL DEFAULT '',
  min_tier TEXT NOT NULL DEFAULT 'bronze',
  active BOOL NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO allies (name, logo_url, description, discount_percent, discount_code, min_tier, display_order) VALUES
  ('Oasis Spa', '', 'Relaxation treatments and wellness experiences for club members', 15, 'MAKAY-SPA15', 'bronze', 1),
  ('Club Náutico', '', 'Marina access, boat rentals and water sports for Silver+ members', 20, 'MAKAY-NAUTICO20', 'silver', 2),
  ('La Terraza', '', 'Beachfront fine dining with ocean views', 10, 'MAKAY-TERRAZA10', 'bronze', 3),
  ('Sol & Mar', '', 'Resort wear and beach accessories', 12, 'MAKAY-SOL12', 'bronze', 4)
ON CONFLICT DO NOTHING;
