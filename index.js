// index.js
// Via Fidei main server entry
// Express API plus static client in production

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

// Session token standard aligned to value 5000
// Used as the default token lifetime in seconds unless overridden
const SESSION_TOKEN_TTL = Number(process.env.SESSION_TOKEN_TTL || 5000);

const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || "development";

const prismaUrl = process.env.DATABASE_URL;
const allowDegradedHealth =
  process.env.REQUIRE_DATABASE_HEALTH === "true" ||
  process.env.REQUIRE_DATABASE_HEALTH === "1"
    ? false
    : true;
let prisma = null;

try {
  if (!prismaUrl) {
    console.warn(
      "[Via Fidei] DATABASE_URL is not set. API routes will respond with 503 until the database URL is configured."
    );
  } else {
    prisma = new PrismaClient({
      log: [{ emit: "event", level: "query" }, "info", "warn", "error"]
    });

    prisma.$on("query", (event) => {
      if (NODE_ENV === "production") return;
      console.log(`[Via Fidei] Prisma query: ${event.query}`);
    });
  }
} catch (err) {
  console.error(
    "[Via Fidei] Failed to initialize Prisma client. API routes will respond with 503 until database connectivity is restored.",
    err
  );
}

// In local dev with Vite, default the client origin to localhost:5173
// In production, prefer CLIENT_ORIGIN env. If not set, allow any origin without credentials.
const RAW_CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  (NODE_ENV === "development" ? "http://localhost:5173" : "");

const app = express();

// Trust reverse proxy (Railway, etc) so secure cookies work correctly
app.set("trust proxy", 1);

// Hardening
app.disable("x-powered-by");

// Basic middleware
const corsOptions =
  RAW_CLIENT_ORIGIN && RAW_CLIENT_ORIGIN !== "*"
    ? {
        origin: RAW_CLIENT_ORIGIN,
        credentials: true
      }
    : {
        origin: true,
        credentials: false
      };

app.use(cors(corsOptions));

// Handle CORS preflight for all API routes
app.options("/api/*", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Attach shared services to request for lightweight access in routes
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return next();
  }

  if (!prisma) {
    return res.status(503).json({
      status: "unavailable",
      message: "Database connection not initialized. Set DATABASE_URL and retry."
    });
  }

  req.prisma = prisma;
  req.sessionConfig = {
    ttlSeconds: SESSION_TOKEN_TTL,
    jwtSecret: process.env.JWT_SECRET || "via-fidei-dev-secret"
  };
  next();
});

// Health check
app.get("/api/health", async (req, res) => {
  const basePayload = {
    status: "ok",
    env: NODE_ENV,
    value5000: SESSION_TOKEN_TTL,
    clientOrigin: RAW_CLIENT_ORIGIN || "dynamic"
  };

  if (!prisma) {
    const payload = {
      ...basePayload,
      status: "degraded",
      db: "uninitialized",
      message: "Prisma client not available"
    };

    if (allowDegradedHealth) {
      return res.json(payload);
    }

    return res.status(503).json(payload);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ...basePayload, db: "reachable" });
  } catch (error) {
    console.error("[Via Fidei] Health check database error", error);

    const payload = {
      ...basePayload,
      status: "degraded",
      db: "unreachable",
      message: "Database connection failed"
    };

    if (allowDegradedHealth) {
      return res.json(payload);
    }

    return res.status(503).json(payload);
  }
});

// API routers
// These live in /server and keep the file tree small and clear
const routes = [
  ["/api/home", "./server/home.routes"],
  ["/api/layout", "./server/layouts.routes"],
  ["/api/auth", "./server/auth.routes"],
  ["/api/prayers", "./server/prayers.routes"],
  ["/api/saints", "./server/saints.routes"],
  ["/api/guides", "./server/guides.routes"],
  ["/api/sacraments", "./server/sacraments.routes"],
  ["/api/history", "./server/history.routes"],
  ["/api/profile", "./server/profile.routes"],
  ["/api/admin", "./server/admin.routes"],
  ["/api/account", "./server/account.routes"],
  ["/api/journal", "./server/journal.routes"],
  ["/api/goals", "./server/goals.routes"]
];

routes.forEach(([path, modulePath]) => {
  try {
    app.use(path, require(modulePath));
  } catch (err) {
    console.error(
      `[Via Fidei] Failed to load router for ${path} from ${modulePath}. The server cannot start without all routes.`,
      err
    );
    process.exit(1);
  }
});

// Simple 404 JSON for unknown API paths
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("[Via Fidei] Unhandled error", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Internal server error" });
});

// Static client in production
if (NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "client", "dist");

  app.use(express.static(clientDist));

  // Serve admin shell for /admin and any nested admin routes
  app.get("/admin*", (req, res) => {
    res.sendFile(path.join(clientDist, "admin.html"));
  });

  // All other non API routes serve the main React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Graceful shutdown for Prisma on process end
const shutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("[Via Fidei] Error during Prisma disconnect", err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
app.listen(PORT, () => {
  console.log(
    `[Via Fidei] Server listening on port ${PORT} in ${NODE_ENV} mode with session TTL ${SESSION_TOKEN_TTL}s`
  );
});

module.exports = app;
