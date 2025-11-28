// server/admin.routes.js
// Admin login and homepage content management for Via Fidei

const express = require("express");

const router = express.Router();

const ADMIN_COOKIE_NAME = "vf_admin_session";
const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Simple shared secret for the admin cookie value
// Set ADMIN_SESSION_SECRET in Railway for production
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "via-fidei-admin-ok";

// Default admin credentials if not overridden in environment
// Username: "Ryan Simonds"
// Password: "Santidade"
const DEFAULT_ADMIN_USERNAME = "Ryan Simonds";
const DEFAULT_ADMIN_PASSWORD = "Santidade";

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

function adminCookieOptions() {
  const isProduction = (process.env.NODE_ENV || "development") === "production";
  const ttlSeconds = Number(process.env.SESSION_TOKEN_TTL || 5000);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: ttlSeconds * 1000
  };
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

/**
 * Resolve the active language for the request.
 * Priority:
 *   1. Body language or lang
 *   2. Query language or lang
 *   3. Authenticated user preference
 *   4. DEFAULT_LANGUAGE env
 *   5. Accept Language header
 *   6. English
 */
function resolveLanguage(req) {
  const tryLang = (value) => {
    if (!value) return null;
    const lower = String(value).toLowerCase();
    return SUPPORTED_LANGS.includes(lower) ? lower : null;
  };

  const bodyLang = req.body?.language || req.body?.lang;
  const queryLang = req.query?.language || req.query?.lang;
  const userPref = req.user?.languageOverride;
  const envPref = process.env.DEFAULT_LANGUAGE;

  const candidates = [bodyLang, queryLang, userPref, envPref];

  for (const candidate of candidates) {
    const resolved = tryLang(candidate);
    if (resolved) return resolved;
  }

  const header = req.headers?.["accept-language"];
  if (typeof header === "string" && header.length > 0) {
    const first = header.split(",")[0].trim().toLowerCase();
    if (SUPPORTED_LANGS.includes(first)) return first;
    const base = first.split("-")[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }

  return "en";
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token || token !== ADMIN_SESSION_SECRET) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
}

// Small helper so all SiteContent writes are consistent
async function upsertSiteContent(prisma, language, key, content) {
  const existing = await prisma.siteContent.findFirst({
    where: { language, key }
  });

  if (existing) {
    return prisma.siteContent.update({
      where: { id: existing.id },
      data: { content }
    });
  }

  return prisma.siteContent.create({
    data: { language, key, content }
  });
}

// Admin login
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  // Environment variables override the defaults
  const expectedUser = process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  // Set an opaque token based on ADMIN_SESSION_SECRET
  res
    .cookie(ADMIN_COOKIE_NAME, ADMIN_SESSION_SECRET, adminCookieOptions())
    .json({ ok: true });
});

// Admin logout
router.post("/logout", (req, res) => {
  const isProduction = (process.env.NODE_ENV || "development") === "production";

  res
    .clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/"
    })
    .json({ ok: true });
});

// Status endpoint so the client knows whether to show the admin panel
router.get("/status", (req, res) => {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  res.json({ authenticated: token === ADMIN_SESSION_SECRET });
});

// Lightweight overview for the admin dashboard
// Lets you confirm that seeds ran and content is present.
router.get("/overview", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const [
      prayersCount,
      saintsCount,
      apparitionsCount,
      sacramentsCount,
      historyCount,
      guidesCount,
      noticesCount
    ] = await Promise.all([
      prisma.prayer.count({ where: { language, isActive: true } }),
      prisma.saint.count({ where: { language, isActive: true } }),
      prisma.apparition.count({ where: { language, isActive: true } }),
      prisma.sacrament.count({ where: { language, isActive: true } }),
      prisma.historySection.count({ where: { language, isActive: true } }),
      prisma.guide.count({ where: { language, isActive: true } }),
      prisma.notice.count({ where: { language } })
    ]);

    res.json({
      language,
      counts: {
        prayers: prayersCount,
        saints: saintsCount,
        apparitions: apparitionsCount,
        sacraments: sacramentsCount,
        historySections: historyCount,
        guides: guidesCount,
        notices: noticesCount
      }
    });
  } catch (error) {
    console.error("[Via Fidei] Admin overview error", error);
    res.status(500).json({ error: "Failed to load admin overview" });
  }
});

// Load homepage content for admin Home mirror
// Includes mission, about, notices, collage config, and liturgical theme
router.get("/home", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const [missionRow, aboutRow, collageRow, notices, themeRow] =
      await Promise.all([
        prisma.siteContent.findFirst({
          where: { language, key: "MISSION" }
        }),
        prisma.siteContent.findFirst({
          where: { language, key: "ABOUT" }
        }),
        prisma.siteContent.findFirst({
          where: { language, key: "PHOTO_COLLAGE" }
        }),
        prisma.notice.findMany({
          where: { language },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }]
        }),
        prisma.siteContent.findFirst({
          where: { language: "global", key: "LITURGICAL_THEME" }
        })
      ]);

    const themeContent = safeJsonParse(themeRow && themeRow.content) || {};
    const allowed = ["normal", "advent", "easter"];
    const liturgicalTheme = allowed.includes(themeContent.liturgicalTheme)
      ? themeContent.liturgicalTheme
      : "normal";

    res.json({
      language,
      mission: missionRow?.content || null,
      about: aboutRow?.content || null,
      collage: collageRow?.content || null,
      liturgicalTheme,
      notices
    });
  } catch (error) {
    console.error("[Via Fidei] Admin home load error", error);
    res.status(500).json({ error: "Failed to load admin home content" });
  }
});

// Update mission and About in one request for the mirrored home editor
router.put("/home", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { mission, about } = req.body || {};

  try {
    const ops = [];
    if (mission != null) {
      ops.push(upsertSiteContent(prisma, language, "MISSION", mission));
    }
    if (about != null) {
      ops.push(upsertSiteContent(prisma, language, "ABOUT", about));
    }

    if (ops.length === 0) {
      return res.status(400).json({
        error: "Nothing to update. Provide mission and or about in the request body"
      });
    }

    const results = await Promise.all(ops);

    const updatedMission = results.find((row) => row.key === "MISSION");
    const updatedAbout = results.find((row) => row.key === "ABOUT");

    res.json({
      mission: updatedMission?.content ?? mission ?? null,
      about: updatedAbout?.content ?? about ?? null
    });
  } catch (error) {
    console.error("[Via Fidei] Admin combined home update error", error);
    res.status(500).json({ error: "Failed to update home content" });
  }
});

// Update mission statement (kept for backwards compatibility)
router.put("/mission", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body?.language || resolveLanguage(req);
  const content = req.body?.content || {};

  try {
    const mission = await upsertSiteContent(prisma, language, "MISSION", content);
    res.json({ mission });
  } catch (error) {
    console.error("[Via Fidei] Admin mission update error", error);
    res.status(500).json({ error: "Failed to update mission content" });
  }
});

// Update About Via Fidei (kept for backwards compatibility)
router.put("/about", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body?.language || resolveLanguage(req);
  const content = req.body?.content || {};

  try {
    const about = await upsertSiteContent(prisma, language, "ABOUT", content);
    res.json({ about });
  } catch (error) {
    console.error("[Via Fidei] Admin about update error", error);
    res.status(500).json({ error: "Failed to update About content" });
  }
});

// Update photo collage configuration via JSON payload
// Expecting content to be an object like { photos: [{ id, url, alt }, ...] }
router.put("/photo-collage", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body?.language || resolveLanguage(req);
  const content = req.body?.content || {};

  try {
    const collage = await upsertSiteContent(
      prisma,
      language,
      "PHOTO_COLLAGE",
      content
    );
    res.json({ collage });
  } catch (error) {
    console.error("[Via Fidei] Admin collage update error", error);
    res.status(500).json({ error: "Failed to update photo collage" });
  }
});

// Collage upload endpoint that matches the React admin FormData upload
// Expects an upstream upload middleware to populate req.files for field "images"
router.post("/collage", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body?.language || resolveLanguage(req);

  try {
    let photos = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      photos = req.files
        .map((file) => {
          const url = file.location || file.url || file.path;
          if (!url) return null;
          return {
            id: file.filename || file.key || url,
            url,
            alt: file.originalname || "Via Fidei photo"
          };
        })
        .filter(Boolean);
    } else if (req.body && Array.isArray(req.body.photos)) {
      photos = req.body.photos;
    }

    const content = { photos };

    const collage = await upsertSiteContent(
      prisma,
      language,
      "PHOTO_COLLAGE",
      content
    );

    res.json({ collage: collage.content });
  } catch (error) {
    console.error("[Via Fidei] Admin collage upload error", error);
    res.status(500).json({ error: "Failed to save collage photos" });
  }
});

// Liturgical theme toggle for banner (Normal, Advent, Easter)
router.put("/theme", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const liturgicalTheme = String(
    req.body?.liturgicalTheme || "normal"
  ).toLowerCase();

  const allowed = ["normal", "advent", "easter"];
  if (!allowed.includes(liturgicalTheme)) {
    return res.status(400).json({ error: "Invalid liturgical theme value" });
  }

  try {
    const row = await upsertSiteContent(prisma, "global", "LITURGICAL_THEME", {
      liturgicalTheme
    });

    res.json({ liturgicalTheme: row.content.liturgicalTheme });
  } catch (error) {
    console.error("[Via Fidei] Admin theme update error", error);
    res.status(500).json({ error: "Failed to update liturgical theme" });
  }
});

// Notices

// List notices for admin
router.get("/notices", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.query?.language || resolveLanguage(req);

  try {
    const notices = await prisma.notice.findMany({
      where: { language },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }]
    });

    res.json({ notices });
  } catch (error) {
    console.error("[Via Fidei] Admin notices list error", error);
    res.status(500).json({ error: "Failed to load notices" });
  }
});

// Create notice
router.post("/notices", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const { title, body, language, displayOrder } = req.body || {};
  const lang = language || resolveLanguage(req);

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  try {
    const notice = await prisma.notice.create({
      data: {
        title,
        body,
        language: lang,
        displayOrder: displayOrder ?? 0
      }
    });

    res.status(201).json({ notice });
  } catch (error) {
    console.error("[Via Fidei] Admin notice create error", error);
    res.status(500).json({ error: "Failed to create notice" });
  }
});

// Update notice
router.put("/notices/:id", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const { id } = req.params;
  const { title, body, displayOrder, isActive } = req.body || {};

  try {
    const notice = await prisma.notice.update({
      where: { id },
      data: {
        ...(title != null ? { title } : {}),
        ...(body != null ? { body } : {}),
        ...(displayOrder != null ? { displayOrder } : {}),
        ...(isActive != null ? { isActive } : {})
      }
    });

    res.json({ notice });
  } catch (error) {
    console.error("[Via Fidei] Admin notice update error", error);
    res.status(500).json({ error: "Failed to update notice" });
  }
});

// Delete notice
router.delete("/notices/:id", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const { id } = req.params;

  try {
    await prisma.notice.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Admin notice delete error", error);
    res.status(500).json({ error: "Failed to delete notice" });
  }
});

module.exports = router;
module.exports.requireAdmin = requireAdmin;
module.exports.ADMIN_COOKIE_NAME = ADMIN_COOKIE_NAME;
