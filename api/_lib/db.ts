import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../../shared/schema.js";

// Created only when a connection string is present, so importing this module
// never fails and the in-memory adapter can be used instead.
//
// The driver reaches PostgreSQL over a WebSocket rather than a TCP pool: a
// serverless function is frozen between invocations and cannot hold a pool
// open. See docs/architecture.md.
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

// Both are null when DATABASE_URL is unset — callers must check.
export { pool, db };
