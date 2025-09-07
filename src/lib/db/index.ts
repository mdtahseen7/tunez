import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Using pg Pool against Neon (Neon DB everywhere, stable driver interface)
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

export const db = drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  console.log("[db] pg Pool driver initialized (Neon DB)");
}
