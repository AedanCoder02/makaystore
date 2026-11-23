import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// prepare: false required for Neon PgBouncer (transaction mode)
// Without it, ALTER TABLE and cached prepared statements conflict
const sql = postgres(connectionString, { max: 5, prepare: false });

export default sql;
