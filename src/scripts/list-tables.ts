import sql from '../lib/db';

async function main() {
  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log(rows.map((r: any) => r.table_name).join(', '));
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
