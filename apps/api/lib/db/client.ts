import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

// neon-http: one round trip per query, ideal for stateless Vercel functions.
// No interactive transactions — by design, our writes are idempotent instead.
const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
export { schema };
