import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgres://user:password@localhost:5432/dbname",
});
export const db = drizzle(pool);
