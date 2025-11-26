// server/layout.routes.js
// Global layout data for Via Fidei
// Navigation, liturgical theme, and optional user summary

const express = require("express");
const jwt = require("jsonwebtoken");
const { SESSION_COOKIE_NAME, clearSession } = require("./auth.routes");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Shared helpers

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

/**
 * Resolve the active language for the request.
 * Priority:
 *   1. Authenticated user preference (if available)
 *   2. Explicit query param ?language= or ?lang=
 *   3. DEFAULT_LANGUAGE env
 *   4. Accept Language header
 *   5. English
 */
function resolveLanguage(req) {
  const tryLang = (value) => {
    if (!value) return null;
    const lower = String(value).toLowerCase();
    return SUPPORTED_LANGS.includes(lower) ? lower : null;
  };

  const userPref = req.user && req.user.languageOverride;
  const queryPref = req.query && (req.query.language || req.query.lang);
  const envPref = process.env.DEFAULT_LANGUAGE;

  const fromUser = tryLang(userPref);
  if (fromUser) return fromUser;

  const fromQuery = tryLang(queryPref);
  if (fromQuery) return fromQuery;

  const fromEnv = tryLang(envPref);
  if (fromEnv) return fromEnv;

  const header = req.headers && req.headers["accept-language"];
  if (typeof header === "string" && header.length > 0) {
    const first = header.split(",")[0].trim().toLowerCase();
    if (SUPPORTED_LANGS.includes(first)) return first;
    const base = first.split("-")[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }

  return "en";
}

function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function getJwtSecret(req) {
  return (
    req.sessionConfig?.jwtSecret ||
    process.env.JWT_SECRET ||
    "via-fidei-dev-secret"
  );
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// Resolve current user from session cookie if present.
// Layout must work for both anonymous and authenticated visitors.
async function resolveCurrentUser(req, res) {
  const prisma = getPrisma(req);
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret(req));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      clearSession(res);
      return null;
    }

    return user;
  } catch (err) {
    console.error("[Via Fidei] Layout session token error", err);
    clearSession(res);
    return null;
  }
}

// Static navigation model for the app shell.
// The frontend can map these targets to concrete routes.
const PRIMARY_NAV = [
  { id: "home", label: "Home", target: "home", icon: "home" },
  { id: "prayers", label: "Prayers", target: "prayers", icon: "prayer" },
  { id: "saints", label: "Saints", target: "saints", icon: "saint" },
  {
    id: "apparitions",
    label: "Our Lady",
    target: "apparitions",
    icon: "our-lady"
  },
  {
    id: "sacraments",
    label: "Sacraments",
    target: "sacraments",
    icon: "sacrament"
  },
  { id: "guides", label: "Guides", target: "guides", icon: "guide" },
  { id: "history", label: "History", target: "history", icon: "history" }
];

const SECONDARY_NAV = [
  {
    id: "journal",
    label: "Journal",
    target: "journal",
    icon: "journal"
  },
  { id: "goals", label: "Goals", target: "goals", icon: "goals" },
  {
    id: "milestones",
    label: "Milestones",
    target: "milestones",
    icon: "milestone"
  },
  { id: "profile", label: "Account", target: "profile", icon: "account" },
  { id: "settings", label: "Settings", target: "settings", icon: "settings" }
];

// GET /api/layout
// Global chrome data: language, liturgical theme, nav, and optional user summary
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const [user, themeRow] = await Promise.all([
      resolveCurrentUser(req, res),
      prisma.siteContent.findFirst({
        where: { language: "global", key: "LITURGICAL_THEME" }
      })
    ]);

    const themeContent = safeJsonParse(themeRow && themeRow.content);
    const allowedThemes = ["normal", "advent", "easter"];
    const liturgicalTheme =
      themeContent &&
      typeof themeContent.liturgicalTheme === "string" &&
      allowedThemes.includes(themeContent.liturgicalTheme)
        ? themeContent.liturgicalTheme
        : "normal";

    res.json({
      language,
      liturgicalTheme,
      navigation: {
        primary: PRIMARY_NAV,
        secondary: SECONDARY_NAV
      },
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error("[Via Fidei] Layout load error", error);
    res.status(500).json({ error: "Failed to load layout data" });
  }
});

module.exports = router;
