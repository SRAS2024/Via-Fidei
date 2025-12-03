// database/prestart.js
// Ensures Prisma migrations run before server start and surfaces clear errors for Railway deployments

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const schemaPath = "./prisma.schema";
const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn(
    "[Via Fidei] DATABASE_URL is not set. Skipping Prisma migrations. Set the Railway PostgreSQL URL to enable automatic schema sync."
  );
  process.exit(0);
}

try {
  console.log("[Via Fidei] Applying Prisma migrations with migrate deploy...");
  const hasMigrations =
    fs.existsSync(migrationsDir) &&
    fs.readdirSync(migrationsDir).filter((entry) => !entry.startsWith(".")).length > 0;

  if (!hasMigrations) {
    console.log(
      "[Via Fidei] No Prisma migrations found (prisma/migrations is missing or empty). Skipping migrate deploy and continuing startup."
    );
    process.exit(0);
  }

  execSync(`npx prisma migrate deploy --schema=${schemaPath}`, { stdio: "inherit" });
  console.log("[Via Fidei] Prisma migrations applied successfully.");
} catch (error) {
  console.error(
    "[Via Fidei] Prisma migration failed. Ensure Railway database is provisioned, DATABASE_URL is set, and migrations are valid.",
    error
  );
  process.exit(1);
}
