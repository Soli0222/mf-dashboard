import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "node:path";
import pg from "pg";
import * as schema from "./schema/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: pg.Pool | null = null;

function getDatabaseUrl(): string {
  // DATABASE_URL が直接指定されていればそのまま使う
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // 個別の POSTGRES_* 環境変数から組み立てる
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB;
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";

  if (user && password && db) {
    return `postgresql://${user}:${password}@${host}:${port}/${db}`;
  }

  throw new Error(
    "Database connection not configured. Set DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB.",
  );
}

export function isDatabaseAvailable(): boolean {
  return !!(process.env.DATABASE_URL || (process.env.POSTGRES_USER && process.env.POSTGRES_DB));
}

export function getDb() {
  if (!_db) {
    _pool = new pg.Pool({ connectionString: getDatabaseUrl() });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

/**
 * Generic Db type compatible with both NodePgDatabase and PgliteDatabase.
 * This allows test code using PGlite to share the same type as production code using node-postgres.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export async function initDb() {
  const db = getDb();

  // Apply migrations
  await migrate(db, { migrationsFolder: join(import.meta.dirname, "../drizzle") });

  return db;
}

export { schema };

// Shared utilities
export * from "./shared/group-filter";
export * from "./shared/transfer";
export * from "./shared/utils";

// Query modules
export * from "./queries/groups";
export * from "./queries/transaction";
export * from "./queries/summary";
export * from "./queries/account";
export * from "./queries/asset";
export * from "./queries/holding";
