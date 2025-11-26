// server/home.routes.js
// Public Home data for Via Fidei
// Mission statement, About Via Fidei, Notices, optional photo collage

const express = require("express");

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
  const candidates = [
    req.user && req.user.languageOverride,
    req.query && (req.query.language || req.query.lang),
    process.env.DEFAULT_LANGUAGE,
    "en"
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const lower = String(candidate).toLowerCase();
    if (SUPPORTED_LANGS.includes(lower)) {
      return lower;
    }
  }

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

// Default mission text used as a safe fallback when the database
// does not yet have SiteContent for the requested language.
function defaultMission(language) {
  return {
    heading: "Via Fidei",
    subheading: "A calm path for growing in faith",
    body: [
      "Via Fidei exists to be a quiet and trustworthy space where the devout faithful can grow more deeply in their relationship with God.",
      "It is also a place where those who are searching or returning to the Church can access clear and reliable teaching and resources.",
      "In every supported language the mission of Via Fidei is the same: to help people encounter Christ and his Church with clarity, beauty, and depth."
    ]
  };
}

// Default About text used as a safe fallback when the database
// does not yet have SiteContent for the requested language.
function defaultAbout(language) {
  return {
    paragraphs: [
      "Via Fidei is a multilingual Catholic website and app that gathers prayers, saints, sacraments, guides, and tools for personal spiritual growth into one quiet place.",
      "Its design is intentionally simple and reverent so that each page can be read slowly. Typography, spacing, and color are chosen to support prayer rather than compete with it.",
      "The experience is personal and private. There is no public feed and no comments. The focus is to help each person rest in the presence of God and to draw closer to him through the life of the Church."
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
  const parsed = safeJsonParse(siteContentEntry && siteContentEntry.content);

  if (parsed && typeof parsed === "object") {
    const heading =
      typeof parsed.heading === "string" && parsed.heading.trim()
        ? parsed.heading.trim()
        : defaultMission(language).heading;

    const subheading =
      typeof parsed.subheading === "string" && parsed.subheading.trim()
        ? parsed.subheading.trim()
        : defaultMission(language).subheading;

    const body =
      Array.isArray(parsed.body) && parsed.body.length > 0
        ? parsed.body.map((p) => String(p))
        : defaultMission(language).body;

    return { heading, subheading, body };
  }

  if (siteContentEntry && typeof siteContentEntry.content === "string") {
    return {
      heading: defaultMission(language).heading,
      subheading: defaultMission(language).subheading,
      body: [siteContentEntry.content]
    };
  }

  return defaultMission(language);
}

function normalizeAbout(siteContentEntry, language) {
  const parsed = safeJsonParse(siteContentEntry && siteContentEntry.content);

  if (parsed && typeof parsed === "object") {
    const paragraphs =
      Array.isArray(parsed.paragraphs) && parsed.paragraphs.length > 0
        ? parsed.paragraphs.map((p) => String(p))
        : defaultAbout(language).paragraphs;

    const quickLinks =
      Array.isArray(parsed.quickLinks) && parsed.quickLinks.length > 0
        ? parsed.quickLinks.map((link) => ({
            target: String(link.target || "").trim(),
            label: String(link.label || "").trim()
          }))
        : defaultAbout(language).quickLinks;

    return { paragraphs, quickLinks };
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
  const parsed = safeJsonParse(siteContentEntry && siteContentEntry.content);
  if (!parsed || typeof parsed !== "object") return [];

  const photos = Array.isArray(parsed.photos) ? parsed.photos : [];
  const result = [];
  const seen = new Set();

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
    startsAt: n.startsAt,
    endsAt: n.endsAt
  };
}

// Public home payload
router.get("/", async (req, res) => {
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
          where: { language, isActive: true },
          orderBy: { displayOrder: "asc" }
        }),
        // Global liturgical theme shared across languages
        prisma.siteContent.findFirst({
          where: { language: "global", key: "LITURGICAL_THEME" }
        })
      ]);

    const mission = normalizeMission(missionRow, language);
    const about = normalizeAbout(aboutRow, language);
    const collage = collageRow ? collageRow.content : null;
    const collagePhotos = normalizeCollage(collageRow);

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
      mission,
      about,
      // Legacy field kept for any old client code
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
