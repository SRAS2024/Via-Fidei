// database/prestart.js
// Ensures Prisma migrations run before server start and surfaces clear errors for Railway deployments

const { execSync } = require("child_process");

const schemaPath = "./prisma.schema";
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn(
    "[Via Fidei] DATABASE_URL is not set. Skipping Prisma migrations. Set the Railway PostgreSQL URL to enable automatic schema sync."
  );
  process.exit(0);
}

try {
  console.log("[Via Fidei] Applying Prisma migrations with migrate deploy...");
  execSync(`npx prisma migrate deploy --schema=${schemaPath}`, { stdio: "inherit" });
  console.log("[Via Fidei] Prisma migrations applied successfully.");
} catch (error) {
  console.error(
    "[Via Fidei] Prisma migration failed. Ensure Railway database is provisioned, DATABASE_URL is set, and migrations are valid.",
    error
  );
  process.exit(1);
}
