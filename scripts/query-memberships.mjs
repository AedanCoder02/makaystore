import postgres from 'postgres';

const sql = postgres('postgresql://neondb_owner:npg_ivq24PYWxBjp@ep-raspy-forest-at258m7w-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

const rows = await sql`
  SELECT id, title, price, status, category
  FROM products
  WHERE category ILIKE '%mem%'
     OR title ILIKE '%membre%'
     OR title ILIKE '%bronce%'
     OR title ILIKE '%plata%'
     OR title ILIKE '%oro%'
     OR title ILIKE '%membership%'
  ORDER BY id
`;
console.log('Found:', rows.length);
console.log(JSON.stringify(rows, null, 2));

await sql.end();
