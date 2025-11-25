// server/home.routes.js
// Public Home data for Via Fidei
// Mission, About Via Fidei, Notices, optional photo collage

const express = require("express");

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

function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

// Default mission text, reused as fallback when there is no DB content
function defaultMission(language) {
  return {
    heading: "Via Fidei",
    subheading: "A space for the devout faithful and the searching soul",
    body: [
      "Via Fidei exists to be a quiet place where the devout faithful can grow more deeply in their relationship with God.",
      "It is also a place where those who are searching or curious can receive clear and trustworthy teaching about the Catholic faith.",
      "In every supported language, the heart of Via Fidei is to help people encounter Christ and his Church with clarity, beauty, and depth."
    ]
  };
}

// Default About content, reused as fallback
function defaultAbout(language) {
  return {
    paragraphs: [
      "Via Fidei is a Catholic website and app that aims to be calm, clear, and reverent.",
      "It gathers a curated library of approved prayers, the lives of the saints, guides for the sacramental life, and tools for daily devotion.",
      "The design is meant to be simple and peaceful so that visitors can pray, study, and rest their minds on the Lord and the wisdom of the Church."
    ],
    quickLinks: [
      { target: "sacraments", label: "Sacraments" },
      { target: "guides-ocia", label: "OCIA" },
      { target: "guides-rosary", label: "Rosary" },
      { target: "guides-confession", label: "Confession" },
      { target: "guides", label: "Guides" }
    ]
  };
}

function normalizeMission(siteContentEntry, language) {
  const parsed = safeJsonParse(siteContentEntry?.content);
  if (parsed && typeof parsed.heading === "string" && Array.isArray(parsed.body)) {
    return {
      heading: parsed.heading,
      subheading:
        typeof parsed.subheading === "string"
          ? parsed.subheading
          : defaultMission(language).subheading,
      body: parsed.body
    };
  }

  if (siteContentEntry && typeof siteContentEntry.content === "string") {
    return {
      heading: "Via Fidei",
      subheading: defaultMission(language).subheading,
      body: [siteContentEntry.content]
    };
  }

  return defaultMission(language);
}

function normalizeAbout(siteContentEntry, language) {
  const parsed = safeJsonParse(siteContentEntry?.content);
  if (parsed && Array.isArray(parsed.paragraphs)) {
    return {
      paragraphs: parsed.paragraphs,
      quickLinks: Array.isArray(parsed.quickLinks)
        ? parsed.quickLinks
        : defaultAbout(language).quickLinks
    };
  }

  if (siteContentEntry && typeof siteContentEntry.content === "string") {
    return {
      paragraphs: [siteContentEntry.content],
      quickLinks: defaultAbout(language).quickLinks
    };
  }

  return defaultAbout(language);
}

function normalizeCollage(siteContentEntry) {
  const parsed = safeJsonParse(siteContentEntry?.content);
  if (!parsed) return [];

  const photos = Array.isArray(parsed.photos) ? parsed.photos : parsed;
  if (!Array.isArray(photos)) return [];

  // Deduplicate by url to avoid duplicate entries in the collage
  const seen = new Set();
  const result = [];

  for (const item of photos) {
    if (!item || typeof item !== "object") continue;
    const url = item.url || item.src;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push({
      id: item.id || url,
      url,
      alt: item.alt || "Via Fidei photo"
    });
  }

  return result;
}

function publicNotice(n) {
  return {
    id: n.id,
    language: n.language,
    title: n.title,
    body: n.body,
    displayOrder: n.displayOrder,
    startsAt: n.startsAt || null,
    endsAt: n.endsAt || null
  };
}

// Public home payload
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const [missionRow, aboutRow, collageRow, notices, themeRow] = await Promise.all([
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
        where: { language, isActive: true },
        orderBy: { displayOrder: "asc" }
      }),
      prisma.siteContent.findFirst({
        where: {
          language: "global",
          key: "LITURGICAL_THEME"
        }
      })
    ]);

    const mission = normalizeMission(missionRow, language);
    const about = normalizeAbout(aboutRow, language);
    const collagePhotos = normalizeCollage(collageRow);
    const collage = collagePhotos;

    let liturgicalTheme = "normal";
    if (themeRow && themeRow.content) {
      const parsedTheme = safeJsonParse(themeRow.content) || themeRow.content;
      if (
        parsedTheme &&
        typeof parsedTheme === "object" &&
        typeof parsedTheme.liturgicalTheme === "string"
      ) {
        liturgicalTheme = parsedTheme.liturgicalTheme;
      }
    }

    res.json({
      language,
      mission,
      about,
      // Legacy field if anything else expects it
      collage,
      // New field used by the frontend for the home collage
      collagePhotos,
      liturgicalTheme,
      notices: notices.map(publicNotice)
    });
  } catch (error) {
    console.error("[Via Fidei] Home load error", error);
    res.status(500).json({ error: "Failed to load home content" });
  }
});

module.exports = router;
