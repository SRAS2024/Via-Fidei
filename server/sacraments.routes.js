// server/sacraments.routes.js
// Seven sacraments, content, and links to milestones and goals

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

function publicSacrament(s) {
  return {
    id: s.id,
    language: s.language,
    slug: s.slug,
    name: s.name,
    iconKey: s.iconKey,
    meaning: s.meaning,
    biblicalFoundation: s.biblicalFoundation,
    preparation: s.preparation,
    whatToExpect: s.whatToExpect,
    commonQuestions: s.commonQuestions,
    tags: s.tags,
    source: s.source,
    sourceUrl: s.sourceUrl,
    sourceAttribution: s.sourceAttribution,
    updatedAt: s.updatedAt
  };
}

// List all sacraments for the chosen language
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const sacraments = await prisma.sacrament.findMany({
      where: { language, isActive: true },
      orderBy: { name: "asc" }
    });

    res.json({
      language,
      items: sacraments.map(publicSacrament)
    });
  } catch (error) {
    console.error("[Via Fidei] Sacraments list error", error);
    res.status(500).json({ error: "Failed to load sacraments" });
  }
});

// Load a single sacrament by id or slug
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let sacrament = await prisma.sacrament.findUnique({
      where: { id: idOrSlug }
    });

    if (!sacrament) {
      sacrament = await prisma.sacrament.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!sacrament || !sacrament.isActive) {
      return res.status(404).json({ error: "Sacrament not found" });
    }

    res.json({ sacrament: publicSacrament(sacrament) });
  } catch (error) {
    console.error("[Via Fidei] Sacrament load error", error);
    res.status(500).json({ error: "Failed to load sacrament" });
  }
});

module.exports = router;
