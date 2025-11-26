// server/auth.routes.js
// Authentication and session handling for Via Fidei

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const SESSION_COOKIE_NAME = "vf_session";

// Helpers

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

function getJwtSecret(req) {
  return (
    req.sessionConfig?.jwtSecret ||
    process.env.JWT_SECRET ||
    "via-fidei-dev-secret"
  );
}

function getSessionTtlSeconds(req) {
  const fromReq = req.sessionConfig?.ttlSeconds;
  if (typeof fromReq === "number" && Number.isFinite(fromReq) && fromReq > 0) {
    return fromReq;
  }
  const fromEnv = Number(process.env.SESSION_TOKEN_TTL || 5000);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 5000;
}

function buildCookieOptions() {
  const isProduction = (process.env.NODE_ENV || "development") === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/"
  };
}

function issueSession(res, req, userId) {
  const secret = getJwtSecret(req);
  const ttl = getSessionTtlSeconds(req);
  const now = Math.floor(Date.now() / 1000);

  const token = jwt.sign(
    {
      sub: userId,
      iat: now,
      exp: now + ttl
    },
    secret
  );

  res.cookie(SESSION_COOKIE_NAME, token, {
    ...buildCookieOptions(),
    maxAge: ttl * 1000
  });
}

function clearSession(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    ...buildCookieOptions(),
    maxAge: 0
  });
}

// Middleware for protected routes

async function requireAuth(req, res, next) {
  const prisma = getPrisma(req);
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(req));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      clearSession(res);
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error("[Via Fidei] Auth token verify failed", err);
    clearSession(res);
    return res.status(401).json({ error: "Authentication required" });
  }
}

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    themePreference: user.themePreference,
    languageOverride: user.languageOverride,
    profilePictureUrl: user.profilePictureUrl,
    createdAt: user.createdAt
  };
}

// Routes

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const prisma = getPrisma(req);
  const { firstName, lastName, email, password, passwordConfirm } =
    req.body || {};

  if (!firstName || !lastName || !email || !password || !passwordConfirm) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: normalizedEmail,
        passwordHash,
        themePreference: null,
        languageOverride: null,
        profilePictureUrl: null
      }
    });

    issueSession(res, req, user.id);

    res.status(201).json({
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error("[Via Fidei] Register error", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const prisma = getPrisma(req);
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    issueSession(res, req, user.id);

    res.json({
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error("[Via Fidei] Login error", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const prisma = getPrisma(req);
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return res.json({ user: null });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(req));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      clearSession(res);
      return res.json({ user: null });
    }

    // Optionally refresh cookie lifetime
    issueSession(res, req, user.id);

    res.json({
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error("[Via Fidei] /me token error", error);
    clearSession(res);
    res.json({ user: null });
  }
});

// POST /api/auth/reset-password
// No email service: validate email plus firstName plus lastName, then reset
router.post("/reset-password", async (req, res) => {
  const prisma = getPrisma(req);
  const {
    email,
    firstName,
    lastName,
    newPassword,
    newPasswordConfirm
  } = req.body || {};

  if (
    !email ||
    !firstName ||
    !lastName ||
    !newPassword ||
    !newPasswordConfirm
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPassword !== newPasswordConfirm) {
    return res
      .status(400)
      .json({ error: "New password fields do not match" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedFirst = String(firstName).trim();
  const normalizedLast = String(lastName).trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (
      !user ||
      user.firstName.trim() !== normalizedFirst ||
      user.lastName.trim() !== normalizedLast
    ) {
      return res.status(404).json({
        error:
          "No user found with the provided email, first name, and last name"
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Reset password error", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.clearSession = clearSession;
module.exports.SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;
