// index.js
// Via Fidei · main server entry
// Express API + static client in production

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Session token standard aligned to value 5000
// Used as the default token lifetime in seconds unless overridden
const SESSION_TOKEN_TTL = Number(process.env.SESSION_TOKEN_TTL || 5000);

const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// Basic middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

// Attach shared services to request for lightweight access in routes
app.use((req, res, next) => {
  req.prisma = prisma;
  req.sessionConfig = {
    ttlSeconds: SESSION_TOKEN_TTL,
    jwtSecret: process.env.JWT_SECRET || "via-fidei-dev-secret"
  };
  next();
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      env: NODE_ENV,
      db: "reachable",
      value5000: SESSION_TOKEN_TTL
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      env: NODE_ENV,
      db: "unreachable",
      message: "Database connection failed"
    });
  }
});

// API routers
// These files live in the /server folder and keep the file tree small and clear
try {
  app.use("/api/home", require("./server/home.routes"));
  app.use("/api/auth", require("./server/auth.routes"));
  app.use("/api/prayers", require("./server/prayers.routes"));
  app.use("/api/saints", require("./server/saints.routes"));
  app.use("/api/guides", require("./server/guides.routes"));
  app.use("/api/sacraments", require("./server/sacraments.routes"));
  app.use("/api/history", require("./server/history.routes"));
  app.use("/api/profile", require("./server/profile.routes"));
  app.use("/api/admin", require("./server/admin.routes"));
} catch (err) {
  // During early development some route files may not exist yet.
  // The server can still boot so Railway builds are not blocked.
  // Once all routes are added this catch is only a safeguard.
  console.warn(
    "[Via Fidei] API routes not fully loaded yet. This is expected until all server/*.routes.js files exist."
  );
}

// Static client in production
if (NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "client", "dist");

  app.use(express.static(clientDist));

  // All non API routes serve the React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(
    `[Via Fidei] Server listening on port ${PORT} in ${NODE_ENV} mode with session TTL ${SESSION_TOKEN_TTL}s`
  );
});

module.exports = app;
