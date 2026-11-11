import "dotenv/config";
import { applySchemaToPostgresUrl } from "../src/db/client";

async function main() {
  const url =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log(
      "No DATABASE_URL / DATABASE_URL_UNPOOLED set; PGLite mode applies DDL automatically on boot.",
    );
    return;
  }
  const parsed = new URL(url);
  const dbName = parsed.pathname.replace(/^\//, "");
  console.log(`Applying Drizzle PostgreSQL schema to database "${dbName}"...`);
  await applySchemaToPostgresUrl(url);
  console.log(`Schema migration completed cleanly on "${dbName}".`);
}

main().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
