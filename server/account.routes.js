// server/account.routes.js
// User account profile and settings for Via Fidei

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

/**
 * Resolve the active language for the request.
 * Priority:
 *   1. Authenticated user preference
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

  const userPref = req.user?.languageOverride;
  const queryPref = req.query?.language || req.query?.lang;
  const envPref = process.env.DEFAULT_LANGUAGE;

  const fromUser = tryLang(userPref);
  if (fromUser) return fromUser;

  const fromQuery = tryLang(queryPref);
  if (fromQuery) return fromQuery;

  const fromEnv = tryLang(envPref);
  if (fromEnv) return fromEnv;

  const header = req.headers?.["accept-language"];
  if (typeof header === "string" && header.length > 0) {
    const first = header.split(",")[0].trim().toLowerCase();
    if (SUPPORTED_LANGS.includes(first)) return first;
    const base = first.split("-")[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }

  return "en";
}

function normalizeBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return fallback;
}

async function loadAccountAggregates(prisma, userId, language) {
  const [
    savedPrayers,
    savedSaints,
    savedApparitions,
    totalGoals,
    activeGoals,
    journalTotal,
    journalArchived
  ] = await Promise.all([
    prisma.savedPrayer.count({ where: { userId } }),
    prisma.savedSaint.count({ where: { userId } }),
    prisma.savedApparition.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: "ACTIVE" } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId, isArchived: true } })
  ]);

  return {
    language,
    counts: {
      saved: {
        prayers: savedPrayers,
        saints: savedSaints,
        apparitions: savedApparitions
      },
      goals: {
        total: totalGoals,
        active: activeGoals,
        completed: Math.max(0, totalGoals - activeGoals)
      },
      journal: {
        total: journalTotal,
        archived: journalArchived
      }
    }
  };
}

function publicAccount(user, aggregates, language) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || null,
    language: user.language || language,
    languageOverride: user.languageOverride || null,
    country: user.country || null,
    timeZone: user.timeZone || null,
    defaultHomeTab: user.defaultHomeTab || "home",
    settings: {
      showDailyQuote: user.showDailyQuote ?? true,
      showLatinForStandardPrayers: user.showLatinForStandardPrayers ?? false,
      emailDigestFrequency: user.emailDigestFrequency || "none",
      emailProductUpdates: user.emailProductUpdates ?? false
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    aggregates
  };
}

// Get current account profile plus summary counts
// GET /api/account/me
router.get("/me", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const language = resolveLanguage(req);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const aggregates = await loadAccountAggregates(prisma, userId, language);

    res.json({
      language,
      account: publicAccount(user, aggregates, language)
    });
  } catch (error) {
    console.error("[Via Fidei] Account me load error", error);
    res.status(500).json({ error: "Failed to load account" });
  }
});

// Update profile and preferences for current user
// PUT /api/account/me
// Accepts fields such as:
//   displayName
//   languageOverride
//   country
//   timeZone
//   defaultHomeTab (home, prayers, saints, guides, sacraments, journal, history)
//   showDailyQuote
//   showLatinForStandardPrayers
//   emailDigestFrequency (none, daily, weekly)
//   emailProductUpdates
router.put("/me", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const language = resolveLanguage(req);
  const body = req.body || {};

  const data = {};

  if (typeof body.displayName === "string") {
    const trimmed = body.displayName.trim();
    if (trimmed) {
      data.displayName = trimmed.slice(0, 120);
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "languageOverride")) {
    const lang = String(body.languageOverride || "").toLowerCase();
    data.languageOverride = SUPPORTED_LANGS.includes(lang) ? lang : null;
  }

  if (typeof body.country === "string") {
    const trimmed = body.country.trim();
    data.country = trimmed ? trimmed.slice(0, 80) : null;
  }

  if (typeof body.timeZone === "string") {
    const trimmed = body.timeZone.trim();
    data.timeZone = trimmed ? trimmed.slice(0, 120) : null;
  }

  if (typeof body.defaultHomeTab === "string") {
    const allowedTabs = [
      "home",
      "prayers",
      "saints",
      "guides",
      "sacraments",
      "journal",
      "history"
    ];
    const tab = body.defaultHomeTab.trim().toLowerCase();
    if (allowedTabs.includes(tab)) {
      data.defaultHomeTab = tab;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "showDailyQuote")) {
    data.showDailyQuote = normalizeBoolean(body.showDailyQuote, true);
  }

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "showLatinForStandardPrayers"
    )
  ) {
    data.showLatinForStandardPrayers = normalizeBoolean(
      body.showLatinForStandardPrayers,
      false
    );
  }

  if (typeof body.emailDigestFrequency === "string") {
    const allowed = ["none", "daily", "weekly"];
    const freq = body.emailDigestFrequency.trim().toLowerCase();
    if (allowed.includes(freq)) {
      data.emailDigestFrequency = freq;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "emailProductUpdates")) {
    data.emailProductUpdates = normalizeBoolean(
      body.emailProductUpdates,
      false
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    const aggregates = await loadAccountAggregates(prisma, userId, language);

    res.json({
      language,
      account: publicAccount(user, aggregates, language)
    });
  } catch (error) {
    console.error("[Via Fidei] Account update error", error);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// Permanently delete the current user account and related data
// DELETE /api/account/me  with body { confirm: "DELETE" }
router.delete("/me", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { confirm } = req.body || {};

  if (confirm !== "DELETE") {
    return res.status(400).json({
      error: 'To delete your account, send { "confirm": "DELETE" } in the body'
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.savedPrayer.deleteMany({ where: { userId } });
      await tx.savedSaint.deleteMany({ where: { userId } });
      await tx.savedApparition.deleteMany({ where: { userId } });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.journalEntry.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    // Let the client clear auth cookies or tokens
    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Account delete error", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;
