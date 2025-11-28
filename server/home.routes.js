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
// This mirrors the FALLBACK_MISSION used in the React client.
function defaultMission(language) {
  void language;
  return {
    heading: "Via Fidei",
    subheading: "A Catholic space for clarity, beauty, and depth",
    body: [
      "Via Fidei is a quiet and reverent space where the devout faithful can grow in their relationship with God and where those who are searching can encounter trusted Catholic teaching at a gentle pace.",
      "The mission of Via Fidei is to be a place where both the non religious and the faithful alike can find the prayers, saints, sacraments, and guides they need to deepen in faith. It is a tool for spiritual growth, not noise.",
      "All content is curated, catechism aligned, and presented in a way that is readable, calm, and ordered from top to bottom, left to right."
    ]
  };
}

// Default About text used as a safe fallback when the database
// does not yet have SiteContent for the requested language.
// This mirrors the FALLBACK_ABOUT used in the React client.
function defaultAbout(language) {
  void language;
  return {
    paragraphs: [
      "Via Fidei is designed to be simple, symmetrical, and approachable. The interface favors clarity over clutter so that you can focus on prayer, study, and discernment.",
      "Every section is carefully localized and paired with visual elements like icons and artwork so that the whole experience feels rooted in the life of the Church.",
      "All interactive features are personal and private. There is no social feed or messaging, only tools that support your sacramental life, your goals, and your spiritual journal."
    ],
    quickLinks: [
      { label: "Sacraments", target: "sacraments" },
      { label: "OCIA", target: "guides-ocia" },
      { label: "Rosary", target: "guides-rosary" },
      { label: "Confession", target: "guides-confession" },
      { label: "Guides", target: "guides-root" }
    ]
  };
}

function normalizeMission(siteContentEntry, language) {
  const parsed = safeJsonParse(siteContentEntry && siteContentEntry.content);

  if (parsed && typeof parsed === "object") {
    const fallback = defaultMission(language);

    const heading =
      typeof parsed.heading === "string" && parsed.heading.trim()
        ? parsed.heading.trim()
        : fallback.heading;

    const subheading =
      typeof parsed.subheading === "string" && parsed.subheading.trim()
        ? parsed.subheading.trim()
        : fallback.subheading;

    const body =
      Array.isArray(parsed.body) && parsed.body.length > 0
        ? parsed.body.map((p) => String(p))
        : fallback.body;

    return { heading, subheading, body };
  }

  if (siteContentEntry && typeof siteContentEntry.content === "string") {
    const base = defaultMission(language);
    return {
      heading: base.heading,
      subheading: base.subheading,
      body: [siteContentEntry.content]
    };
  }

  return defaultMission(language);
}

function normalizeAbout(siteContentEntry, language) {
  const parsed = safeJsonParse(siteContentEntry && siteContentEntry.content);

  if (parsed && typeof parsed === "object") {
    const fallback = defaultAbout(language);

    const paragraphs =
      Array.isArray(parsed.paragraphs) && parsed.paragraphs.length > 0
        ? parsed.paragraphs.map((p) => String(p))
        : fallback.paragraphs;

    const quickLinks =
      Array.isArray(parsed.quickLinks) && parsed.quickLinks.length > 0
        ? parsed.quickLinks.map((link) => ({
            target: String(link.target || "").trim(),
            label: String(link.label || "").trim()
          }))
        : fallback.quickLinks;

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
      alt: (item.alt && String(item.alt)) || "Via Fidei photo"
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
  const now = new Date();

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
          where: {
            language,
            isActive: true,
            AND: [
              {
                OR: [
                  { startsAt: null },
                  { startsAt: { lte: now } }
                ]
              },
              {
                OR: [
                  { endsAt: null },
                  { endsAt: { gte: now } }
                ]
              }
            ]
          },
          orderBy: [
            { displayOrder: "asc" },
            { createdAt: "desc" }
          ]
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
