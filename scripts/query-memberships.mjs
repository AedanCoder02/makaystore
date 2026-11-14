import postgres from 'postgres';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = postgres(DB_URL);

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
