// database/prestart.js
// Ensures Prisma migrations run before server start and surfaces clear errors for Railway deployments

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const schemaPath = "./prisma.schema";
const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const dbUrl = process.env.DATABASE_URL;

const hasMigrations =
  fs.existsSync(migrationsDir) &&
  fs
    .readdirSync(migrationsDir)
    .filter((entry) => !entry.startsWith("."))
    .length > 0;

if (!dbUrl) {
  console.warn(
    "[Via Fidei] DATABASE_URL is not set. Skipping Prisma migrations. Set the Railway PostgreSQL URL to enable automatic schema sync."
  );
  process.exit(0);
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const runCommand = (command, label) => {
  console.log(`[Via Fidei] ${label}...`);
  execSync(command, { stdio: "inherit" });
  console.log(`[Via Fidei] ${label} completed.`);
};

const runWithRetry = (command, label, attempts = 3, backoffMs = 1500) => {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      runCommand(command, `${label} (attempt ${i}/${attempts})`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Via Fidei] ${label} failed on attempt ${i}/${attempts}. Waiting ${backoffMs}ms before retry...`,
        error?.message || error
      );
      sleep(backoffMs);
    }
  }
  throw lastError;
};

try {
  if (hasMigrations) {
    runWithRetry(
      `npx prisma migrate deploy --schema=${schemaPath}`,
      "Applying Prisma migrations with migrate deploy"
    );
  } else {
    console.warn(
      "[Via Fidei] No prisma/migrations directory found. Running schema push instead to keep the database in sync."
    );
    runWithRetry(`npx prisma db push --schema=${schemaPath}`, "Synchronizing schema via db push");
  }
} catch (error) {
  if (hasMigrations) {
    console.warn(
      "[Via Fidei] migrate deploy failed. Falling back to Prisma db push to align the schema before start-up."
    );
    try {
      runWithRetry(
        `npx prisma db push --schema=${schemaPath}`,
        "Synchronizing schema via db push fallback"
      );
      process.exit(0);
    } catch (fallbackError) {
      console.error(
        "[Via Fidei] Prisma db push fallback failed. Ensure the database is reachable and the schema is valid.",
        fallbackError
      );
      process.exit(1);
    }
  } else {
    console.error(
      "[Via Fidei] Prisma schema push failed. Ensure Railway database is provisioned, DATABASE_URL is set, and the schema is valid.",
      error
    );
    process.exit(1);
  }
}
