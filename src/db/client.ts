import type { PgliteDatabase } from "drizzle-orm/pglite";
import { getEnv, isDemoMode } from "@/env";
import { INITIAL_DDL_STATEMENTS } from "./ddl";
import * as schema from "./schema";

export type Database = PgliteDatabase<typeof schema>;
export type DbTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
export type DbDriver = "postgres" | "pglite";

const globalDb = globalThis as typeof globalThis & {
  __pocketTheoryDbPromise?: Promise<Database>;
  __pocketTheoryDriver?: DbDriver;
  __pocketTheoryPgPool?: { end: () => Promise<void> };
};

export function activeDbDriver(): DbDriver {
  const url = getEnv().DATABASE_URL?.trim();
  return url ? "postgres" : "pglite";
}

async function applyIdempotentDdl(
  execSql: (statement: string) => Promise<unknown>,
): Promise<void> {
  for (const stmt of INITIAL_DDL_STATEMENTS) {
    try {
      await execSql(stmt);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // 42P07 = duplicate_table, 42710 = duplicate_object (constraint/index)
      if (code === "42P07" || code === "42710") {
        continue;
      }
      throw err;
    }
  }
}

async function initPostgres(connectionString: string): Promise<Database> {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool({
    connectionString,
    max: 6,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 12_000,
  });
  globalDb.__pocketTheoryPgPool = pool;
  return drizzle(pool, { schema }) as unknown as Database;
}

async function initPglite(autoSeedDemo = true): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const pglite = new PGlite();
  await pglite.waitReady;
  await applyIdempotentDdl((stmt) => pglite.exec(stmt));
  const db = drizzle(pglite, { schema });
  if (autoSeedDemo && isDemoMode()) {
    const { seedDatabase } = await import("./seeds");
    await seedDatabase(db, { allowNonTestDb: true });
  }
  return db;
}

export async function getDb(): Promise<Database> {
  if (typeof window !== "undefined") {
    throw new Error("@/db/client is server-only and must never run in browsers.");
  }
  if (!globalDb.__pocketTheoryDbPromise) {
    const driver = activeDbDriver();
    globalDb.__pocketTheoryDriver = driver;
    globalDb.__pocketTheoryDbPromise = (
      driver === "postgres"
        ? initPostgres(getEnv().DATABASE_URL!.trim())
        : initPglite(true)
    ).catch((err) => {
      globalDb.__pocketTheoryDbPromise = undefined;
      throw err;
    });
  }
  return globalDb.__pocketTheoryDbPromise;
}

export async function createFreshTestDb(): Promise<Database> {
  return initPglite(false);
}

export async function applySchemaToPostgresUrl(
  connectionString: string,
): Promise<void> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await applyIdempotentDdl((stmt) => client.query(stmt));
  } finally {
    await client.end();
  }
}
