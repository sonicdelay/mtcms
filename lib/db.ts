import type { Pool } from "pg";

let pool: Pool;

if (process.env.DBPROVIDER === "neon") {
  const { Pool: NeonPool } = await import("@neondatabase/serverless");
  pool = new NeonPool({
    connectionString: process.env.DATABASE_URL,
  }) as unknown as Pool;
} else {
  const { Pool: PgPool } = await import("pg");
  pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
  });
}

export default pool;
