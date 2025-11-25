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

function resolveLanguage(req) {
  const override =
    req.query.language ||
    req.body?.language ||
    req.user?.languageOverride ||
    process.env.DEFAULT_LANGUAGE ||
    "en";

  const lower = String(override).toLowerCase();
  if (SUPPORTED_LANGS.includes(lower)) return lower;

  const header = req.headers["accept-language"];
  if (typeof header === "string") {
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
    const [mission, about, collage, notices, themeRow] = await Promise.all([
      prisma.siteContent.findUnique({
        where: { language_key: { language, key: "MISSION" } }
      }),
      prisma.siteContent.findUnique({
        where: { language_key: { language, key: "ABOUT" } }
      }),
      prisma.siteContent.findUnique({
        where: { language_key: { language, key: "PHOTO_COLLAGE" } }
      }),
      prisma.notice.findMany({
        where: { language, isActive: true },
        orderBy: { displayOrder: "asc" }
      }),
      // Global liturgical theme, shared across languages
      prisma.siteContent.findUnique({
        where: {
          language_key: {
            language: "global",
            key: "LITURGICAL_THEME"
          }
        }
      })
    ]);

    const liturgicalTheme =
      themeRow?.content?.liturgicalTheme || "normal";

    res.json({
      language,
      mission: mission?.content || null,
      about: about?.content || null,
      collage: collage?.content || null,
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

    if (mission) {
      ops.push(
        prisma.siteContent.upsert({
          where: { language_key: { language, key: "MISSION" } },
          create: { language, key: "MISSION", content: mission },
          update: { content: mission }
        })
      );
    }

    if (about) {
      ops.push(
        prisma.siteContent.upsert({
          where: { language_key: { language, key: "ABOUT" } },
          create: { language, key: "ABOUT", content: about },
          update: { content: about }
        })
      );
    }

    const results = await Promise.all(ops);

    const updatedMission = results.find(
      (row) => row.key === "MISSION"
    );
    const updatedAbout = results.find(
      (row) => row.key === "ABOUT"
    );

    res.json({
      mission: updatedMission?.content || mission || null,
      about: updatedAbout?.content || about || null
    });
  } catch (error) {
    console.error("[Via Fidei] Admin combined home update error", error);
    res.status(500).json({ error: "Failed to update home content" });
  }
});

// Update mission statement (kept for backwards compatibility)
router.put("/mission", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body.language || resolveLanguage(req);
  const content = req.body.content || {};

  try {
    const mission = await prisma.siteContent.upsert({
      where: { language_key: { language, key: "MISSION" } },
      create: { language, key: "MISSION", content },
      update: { content }
    });

    res.json({ mission });
  } catch (error) {
    console.error("[Via Fidei] Admin mission update error", error);
    res.status(500).json({ error: "Failed to update mission content" });
  }
});

// Update About Via Fidei (kept for backwards compatibility)
router.put("/about", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body.language || resolveLanguage(req);
  const content = req.body.content || {};

  try {
    const about = await prisma.siteContent.upsert({
      where: { language_key: { language, key: "ABOUT" } },
      create: { language, key: "ABOUT", content },
      update: { content }
    });

    res.json({ about });
  } catch (error) {
    console.error("[Via Fidei] Admin about update error", error);
    res.status(500).json({ error: "Failed to update About content" });
  }
});

// Update photo collage configuration
// Expecting content to be an object like { photos: [{ id, url, alt }, ...] }
router.put("/photo-collage", requireAdmin, async (req, res) => {
  const prisma = getPrisma(req);
  const language = req.body.language || resolveLanguage(req);
  const content = req.body.content || {};

  try {
    const collage = await prisma.siteContent.upsert({
      where: { language_key: { language, key: "PHOTO_COLLAGE" } },
      create: { language, key: "PHOTO_COLLAGE", content },
      update: { content }
    });

    res.json({ collage });
  } catch (error) {
    console.error("[Via Fidei] Admin collage update error", error);
    res.status(500).json({ error: "Failed to update photo collage" });
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
    return res
      .status(400)
      .json({ error: "Invalid liturgical theme value" });
  }

  try {
    const row = await prisma.siteContent.upsert({
      where: {
        language_key: {
          language: "global",
          key: "LITURGICAL_THEME"
        }
      },
      create: {
        language: "global",
        key: "LITURGICAL_THEME",
        content: { liturgicalTheme }
      },
      update: {
        content: { liturgicalTheme }
      }
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
  const language = req.query.language || resolveLanguage(req);

  try {
    const notices = await prisma.notice.findMany({
      where: { language },
      orderBy: { displayOrder: "asc" }
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
