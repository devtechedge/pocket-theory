import "dotenv/config";
import { applySchemaToPostgresUrl, getDb } from "../src/db/client";
import { seedDatabase } from "../src/db/seeds";

async function main() {
  const isExplicitDemoFlag = process.argv.includes("--demo");
  const rawUrl =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (rawUrl) {
    const dbName = new URL(rawUrl).pathname.replace(/^\//, "");
    const isTestOrE2e =
      dbName.includes("test") ||
      dbName.includes("e2e") ||
      dbName.includes("preview");
    const allowProdSeed = process.env.ALLOW_PROD_SEED === "1";

    if (!isTestOrE2e && !allowProdSeed) {
      throw new Error(
        `Refusing to reset/seed non-test database "${dbName}" without ALLOW_PROD_SEED=1.`,
      );
    }

    // Ensure schema exists first
    await applySchemaToPostgresUrl(rawUrl);
    process.env.DATABASE_URL = rawUrl;
  } else if (!isExplicitDemoFlag && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required for production seeding.");
  }

  const db = await getDb();
  const result = await seedDatabase(db, { allowNonTestDb: true });
  console.log(
    `Seeded ${result.productCount} products and ${result.variantCount} variants cleanly.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
