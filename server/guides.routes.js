// server/guides.routes.js
// Guides for Catholic life, practice, discernment, and vocation

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

function publicGuide(g) {
  return {
    id: g.id,
    language: g.language,
    slug: g.slug,
    title: g.title,
    summary: g.summary,
    body: g.body,
    guideType: g.guideType,
    checklistTemplate: g.checklistTemplate,
    tags: g.tags,
    source: g.source,
    sourceUrl: g.sourceUrl,
    sourceAttribution: g.sourceAttribution,
    updatedAt: g.updatedAt
  };
}

// List guides, optionally filtered by guideType
// GET /api/guides?guideType=OCIA|CONFESSION|ROSARY|ADORATION|CONSECRATION|VOCATION|GENERAL
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const guideType = req.query.guideType || null;

  try {
    const guides = await prisma.guide.findMany({
      where: {
        language,
        isActive: true,
        ...(guideType ? { guideType } : {})
      },
      orderBy: [
        { guideType: "asc" },
        { title: "asc" }
      ]
    });

    res.json({
      language,
      items: guides.map(publicGuide)
    });
  } catch (error) {
    console.error("[Via Fidei] Guides list error", error);
    res.status(500).json({ error: "Failed to load guides" });
  }
});

// Load a single guide by id or slug
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let guide = await prisma.guide.findUnique({
      where: { id: idOrSlug }
    });

    if (!guide) {
      guide = await prisma.guide.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!guide || !guide.isActive) {
      return res.status(404).json({ error: "Guide not found" });
    }

    res.json({ guide: publicGuide(guide) });
  } catch (error) {
    console.error("[Via Fidei] Guide load error", error);
    res.status(500).json({ error: "Failed to load guide" });
  }
});

// Add as Goal from within a guide
// POST /api/guides/:idOrSlug/add-goal
router.post("/:idOrSlug/add-goal", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let guide = await prisma.guide.findUnique({
      where: { id: idOrSlug }
    });

    if (!guide) {
      guide = await prisma.guide.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!guide || !guide.isActive) {
      return res.status(404).json({ error: "Guide not found" });
    }

    // Map guideType to a GoalType template
    let goalType = "CUSTOM";
    switch (guide.guideType) {
      case "OCIA":
        goalType = "TEMPLATE_OCIA";
        break;
      case "CONSECRATION":
        goalType = "TEMPLATE_CONSECRATION";
        break;
      case "VOCATION":
        goalType = "TEMPLATE_VOCATION";
        break;
      default:
        // For Confession, Rosary, Adoration, and General,
        // we treat them as a novena or devotional style template where helpful
        goalType = "TEMPLATE_NOVENA";
        break;
    }

    const checklist = guide.checklistTemplate || null;

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: guide.title,
        description: guide.summary || "",
        goalType,
        status: "ACTIVE",
        dueDate: null,
        checklist
      }
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error("[Via Fidei] Add goal from guide error", error);
    res.status(500).json({ error: "Failed to create goal from guide" });
  }
});

module.exports = router;
