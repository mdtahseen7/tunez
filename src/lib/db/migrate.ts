import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from ".";

const main = async () => {
  console.log("⏳ Running migrations (pg driver, Neon DB)...");
  const start = Date.now();
  await migrate(db, { migrationsFolder: "src/lib/db/migrations" });
  console.log("✅ Migrations completed in", Date.now() - start, "ms");
  process.exit(0);
};

main().catch((e) => {
  console.error("❌ Migration failed");
  console.error(e);
  process.exit(1);
});
