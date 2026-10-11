import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'seller_orders' ORDER BY ordinal_position`;
console.log('=== seller_orders columns ===');
cols.forEach(r => console.log(r.column_name, '|', r.data_type));

const count = await sql`SELECT COUNT(*) AS n, MAX(created_at) AS latest FROM seller_orders`;
console.log('\n=== row count / latest ===');
console.log('rows:', count[0].n, '  latest:', count[0].latest);

const sample = await sql`SELECT id, seller_id, subtotal, created_at FROM seller_orders ORDER BY created_at DESC LIMIT 3`;
console.log('\n=== latest 3 rows ===');
sample.forEach(r => console.log(JSON.stringify(r)));

await sql.end();
