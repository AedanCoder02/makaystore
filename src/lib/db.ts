import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

const sql = postgres(connectionString, { max: 5 });

export default sql;
