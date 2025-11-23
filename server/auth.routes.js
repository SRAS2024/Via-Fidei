// server/auth.routes.js
// Authentication and session handling for Via Fidei

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const SESSION_COOKIE_NAME = "vf_session";

// Helpers
function buildCookieOptions(req) {
  const isProduction = (process.env.NODE_ENV || "development") === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: (req.sessionConfig?.ttlSeconds || 5000) * 1000
  };
}

function signToken(req, user) {
  const secret = req.sessionConfig?.jwtSecret || "via-fidei-dev-secret";
  const ttlSeconds = req.sessionConfig?.ttlSeconds || 5000;

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      theme: user.themePreference || null,
      language: user.languageOverride || null
    },
    secret,
    { expiresIn: ttlSeconds }
  );
}

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

// Middleware to extract user from cookie if present
async function attachUser(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = req.sessionConfig?.jwtSecret || "via-fidei-dev-secret";
    const payload = jwt.verify(token, secret);
    const prisma = getPrisma(req);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    req.user = user || null;
  } catch (err) {
    req.user = null;
  }

  next();
}

// Middleware to enforce login
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

router.use(attachUser);

// Shape user for client
function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    themePreference: user.themePreference,
    languageOverride: user.languageOverride,
    profilePictureUrl: user.profilePictureUrl
  };
}

// Register
router.post("/register", async (req, res) => {
  const prisma = getPrisma(req);
  const { firstName, lastName, email, password, reenterPassword } = req.body || {};

  if (!firstName || !lastName || !email || !password || !reenterPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== reenterPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User with that email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash
      }
    });

    const token = signToken(req, user);

    res
      .cookie(SESSION_COOKIE_NAME, token, buildCookieOptions(req))
      .status(201)
      .json({ user: publicUser(user) });
  } catch (error) {
    console.error("[Via Fidei] Register error", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const prisma = getPrisma(req);
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(req, user);

    res
      .cookie(SESSION_COOKIE_NAME, token, buildCookieOptions(req))
      .json({ user: publicUser(user) });
  } catch (error) {
    console.error("[Via Fidei] Login error", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res
    .clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: (process.env.NODE_ENV || "development") === "production",
      sameSite: "strict",
      path: "/"
    })
    .json({ ok: true });
});

// Current user
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(200).json({ user: null });
  }
  res.json({ user: publicUser(req.user) });
});

// Reset password (no email service)
// Fields: email, firstName, lastName, newPassword, reenterNewPassword
router.post("/reset", async (req, res) => {
  const prisma = getPrisma(req);
  const {
    email,
    firstName,
    lastName,
    newPassword,
    reenterNewPassword
  } = req.body || {};

  if (!email || !firstName || !lastName || !newPassword || !reenterNewPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPassword !== reenterNewPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      user.firstName.trim().toLowerCase() !== firstName.trim().toLowerCase() ||
      user.lastName.trim().toLowerCase() !== lastName.trim().toLowerCase()
    ) {
      return res.status(400).json({
        error: "Provided name does not match our records for that email"
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

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
