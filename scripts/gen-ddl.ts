import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const sqlPath = path.resolve(
  process.cwd(),
  "drizzle",
  "0000_pocket_theory_init.sql",
);
const rawSql = readFileSync(sqlPath, "utf8");
const statements = rawSql
  .split("--> statement-breakpoint")
  .map((chunk) => chunk.trim())
  .filter(Boolean);

const output = `// Auto-generated from drizzle/0000_pocket_theory_init.sql - do not hand-edit.
export const INITIAL_DDL_STATEMENTS: readonly string[] = ${JSON.stringify(
  statements,
  null,
  2,
)};
`;

writeFileSync(path.resolve(process.cwd(), "src", "db", "ddl.ts"), output, "utf8");
console.log(`Wrote ${statements.length} DDL statements to src/db/ddl.ts`);
