// server/home.routes.js
// Public Home data for Via Fidei
// Mission statement, About Via Fidei, Notices, optional photo collage

const express = require("express");
const { SiteContentKey } = require("@prisma/client");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

function resolveLanguage(req) {
  const override =
    req.query.language ||
    req.query.lang ||
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

// Helper to load a SiteContent block with language and English fallback
async function loadSiteBlock(prisma, preferredLanguage, keyEnum) {
  // Try preferred language first
  const primary = await prisma.siteContent.findFirst({
    where: {
      language: preferredLanguage,
      key: keyEnum
    }
  });

  if (primary) return primary;

  // Fallback to English if nothing for that language
  if (preferredLanguage !== "en") {
    const fallback = await prisma.siteContent.findFirst({
      where: {
        language: "en",
        key: keyEnum
      }
    });
    if (fallback) return fallback;
  }

  return null;
}

router.get("/api/home", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const [mission, about, collage, notices] = await Promise.all([
      loadSiteBlock(prisma, language, SiteContentKey.MISSION),
      loadSiteBlock(prisma, language, SiteContentKey.ABOUT),
      loadSiteBlock(prisma, language, SiteContentKey.PHOTO_COLLAGE),
      prisma.notice.findMany({
        where: {
          language,
          isActive: true
        },
        orderBy: {
          displayOrder: "asc"
        }
      })
    ]);

    // If there are no notices for the requested language, fall back to English
    let resolvedNotices = notices;
    if (!resolvedNotices || resolvedNotices.length === 0) {
      resolvedNotices = await prisma.notice.findMany({
        where: {
          language: "en",
          isActive: true
        },
        orderBy: {
          displayOrder: "asc"
        }
      });
    }

    // Basic counts for the tabs so the UI is not empty
    const [
      prayerCount,
      saintCount,
      apparitionCount,
      sacramentCount,
      guideCount
    ] = await Promise.all([
      prisma.prayer.count({ where: { language, isActive: true } }),
      prisma.saint.count({ where: { language, isActive: true } }),
      prisma.apparition.count({ where: { language, isActive: true } }),
      prisma.sacrament.count({ where: { language, isActive: true } }),
      prisma.guide.count({ where: { language, isActive: true } })
    ]);

    res.json({
      language,
      mission: mission?.content ?? null,
      about: about?.content ?? null,
      collage: collage?.content ?? null,
      notices: resolvedNotices,
      summaryCounts: {
        prayers: prayerCount,
        saints: saintCount,
        apparitions: apparitionCount,
        sacraments: sacramentCount,
        guides: guideCount
      }
    });
  } catch (err) {
    console.error("[Via Fidei] Home load error", err);
    res.status(500).json({
      error: "HOME_LOAD_ERROR",
      message: "Unable to load home content at this time."
    });
  }
});

module.exports = router;
