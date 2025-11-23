// server/history.routes.js
// Church history overview and timelines for Via Fidei

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
    req.user?.languageOverride ||
    req.query.language ||
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

function publicSection(h) {
  return {
    id: h.id,
    language: h.language,
    slug: h.slug,
    title: h.title,
    summary: h.summary,
    body: h.body,
    timeline: h.timeline,
    tags: h.tags,
    source: h.source,
    sourceUrl: h.sourceUrl,
    sourceAttribution: h.sourceAttribution,
    updatedAt: h.updatedAt
  };
}

// List all history sections for the chosen language in canonical order
// Example slugs: apostolic-age, early-church, councils, middle-ages, reformation,
// modern-era, vatican-councils, contemporary-church
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const sections = await prisma.historySection.findMany({
      where: { language, isActive: true },
      orderBy: { slug: "asc" }
    });

    res.json({
      language,
      items: sections.map(publicSection)
    });
  } catch (error) {
    console.error("[Via Fidei] History list error", error);
    res.status(500).json({ error: "Failed to load history sections" });
  }
});

// Load a single history section by slug or id
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let section = await prisma.historySection.findUnique({
      where: { id: idOrSlug }
    });

    if (!section) {
      section = await prisma.historySection.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!section || !section.isActive) {
      return res.status(404).json({ error: "History section not found" });
    }

    res.json({ section: publicSection(section) });
  } catch (error) {
    console.error("[Via Fidei] History section load error", error);
    res.status(500).json({ error: "Failed to load history section" });
  }
});

module.exports = router;
