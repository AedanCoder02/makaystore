import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const sql = postgres(process.env.DATABASE_URL);

const migration = readFileSync(join(__dir, '../src/lib/migrations/003_allies.sql'), 'utf8');
const statements = migration.split(';').map(s => s.trim()).filter(Boolean);
for (const stmt of statements) {
  console.log('>', stmt.slice(0, 70) + (stmt.length > 70 ? '...' : ''));
  await sql.unsafe(stmt);
}
await sql.end();
console.log('\nMigration 003 complete.');
