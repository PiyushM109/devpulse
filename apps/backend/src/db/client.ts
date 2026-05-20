import { Pool } from 'pg';


if (!process.env.DATABASE_URL) {
    console.log(process.env.DATABASE_URL);
    throw new Error("DATABASE_URL environment variable is required");
}

export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,                     //max simultaneous connections in pool
    idleTimeoutMillis: 30_000,    // close idle connections after 30 seconds
    connectionTimeoutMillis: 5_000 //fail fast DB unreacheble
});

db.on('error', (err) => {
    console.error("unexpected DB pool error : ", err);
    process.exit(1);
});

export async function checkDbConnection(): Promise<void> {
    const client = await db.connect();
    try {
        await client.query('SELECT 1');
        console.log("PostgreSQL conncted");
    } finally {
        client.release();
    }
}