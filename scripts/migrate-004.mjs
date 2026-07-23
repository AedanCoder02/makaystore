import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
await sql`
  INSERT INTO allies (name, logo_url, description, discount_percent, discount_code, min_tier, active, display_order)
  VALUES
    ('Marea Cocktails',       '', 'Handcrafted tropical cocktails and sunset drinks by the pool deck.', 10, 'MAKAY-MAREA10',  'bronze', true, 5),
    ('Vista Pool Bar',        '', 'Rooftop pool bar with panoramic views of the coastline.',            15, 'MAKAY-VISTA15',  'silver', true, 6),
    ('Coral Dive Center',     '', 'Certified diving courses, snorkeling tours, and equipment rental.',   8, 'MAKAY-CORAL08',  'bronze', true, 7),
    ('Brisa Boutique Hotel',  '', 'Exclusive room rates and VIP upgrades for Gold and VIP members.',   25, 'MAKAY-HOTEL25',  'gold',   true, 8),
    ('Sunset Yoga Studio',    '', 'Morning and sunset yoga sessions on the beach, all levels welcome.',  12, 'MAKAY-YOGA12',  'bronze', true, 9)
  ON CONFLICT DO NOTHING;
`;
console.log('Migration 004 complete: 5 new allies added');
await sql.end();
