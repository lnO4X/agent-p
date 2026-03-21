import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Serverless-friendly: limit connections, enable SSL for cloud DBs (Neon/Supabase)
const isProduction = process.env.NODE_ENV === "production";
const client = postgres(connectionString, {
  max: isProduction ? 5 : 10, // Limit pool size for serverless
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Fail fast on connection issues
  ssl: connectionString.includes("neon.tech") || connectionString.includes("supabase")
    ? "require"
    : undefined,
});
export const db = drizzle(client, { schema });
