// server/prayers.routes.js
// Prayers library and local search

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
    req.user?.languageOverride || req.query.language || process.env.DEFAULT_LANGUAGE || "en";
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

// Shape prayer for client
function publicPrayer(p) {
  return {
    id: p.id,
    language: p.language,
    slug: p.slug,
    title: p.title,
    content: p.content,
    category: p.category,
    tags: p.tags,
    source: p.source,
    sourceUrl: p.sourceUrl,
    sourceAttribution: p.sourceAttribution,
    updatedAt: p.updatedAt
  };
}

// List prayers with optional category and pagination
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const category = req.query.category || null;
  const take = Math.min(Number(req.query.take) || 20, 100);
  const cursor = req.query.cursor || null;

  try {
    const where = {
      language,
      isActive: true,
      ...(category ? { category } : {})
    };

    const prayers = await prisma.prayer.findMany({
      where,
      orderBy: { title: "asc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    const hasMore = prayers.length > take;
    if (hasMore) prayers.pop();

    res.json({
      language,
      items: prayers.map(publicPrayer),
      nextCursor: hasMore ? prayers[prayers.length - 1].id : null
    });
  } catch (error) {
    console.error("[Via Fidei] Prayers list error", error);
    res.status(500).json({ error: "Failed to load prayers" });
  }
});

// Get a single prayer by id or slug
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let prayer = await prisma.prayer.findUnique({
      where: { id: idOrSlug }
    });

    if (!prayer) {
      prayer = await prisma.prayer.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!prayer || !prayer.isActive) {
      return res.status(404).json({ error: "Prayer not found" });
    }

    res.json({ prayer: publicPrayer(prayer) });
  } catch (error) {
    console.error("[Via Fidei] Prayer load error", error);
    res.status(500).json({ error: "Failed to load prayer" });
  }
});

// Local search inside Prayers
// GET /api/prayers/search?q=...&mode=suggest|full
router.get("/search/local", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const q = (req.query.q || "").toString().trim();
  const mode = (req.query.mode || "suggest").toString();

  if (!q) {
    return res.json({ language, suggestions: [], results: [] });
  }

  try {
    const where = {
      language,
      isActive: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q.toLowerCase()] } }
      ]
    };

    // Base result set ordered by simple relevance proxy
    const base = await prisma.prayer.findMany({
      where,
      orderBy: [
        { title: "asc" },
        { updatedAt: "desc" }
      ],
      take: mode === "suggest" ? 8 : 50
    });

    // Simple scoring: shorter distance in title and tag match first
    const loweredQ = q.toLowerCase();
    const scored = base
      .map((p) => {
        let score = 0;
        const title = p.title.toLowerCase();
        if (title === loweredQ) score += 100;
        else if (title.includes(loweredQ)) score += 60;

        if ((p.tags || []).includes(loweredQ)) score += 40;

        // Slight boost for more recent updates
        const ageMs = Date.now() - p.updatedAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        score += Math.max(0, 20 - ageDays * 0.5);

        return { p, score };
      })
      .sort((a, b) => b.score - a.score);

    const ordered = scored.map((x) => publicPrayer(x.p));

    const suggestions = ordered.slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: p.category
    }));

    const results = mode === "full" ? ordered : [];

    res.json({
      language,
      query: q,
      suggestions,
      results
    });
  } catch (error) {
    console.error("[Via Fidei] Prayers search error", error);
    res.status(500).json({ error: "Failed to search prayers" });
  }
});

// Example endpoint to save a prayer directly from here if the UI prefers
router.post("/:prayerId/save", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { prayerId } = req.params;

  try {
    const saved = await prisma.savedPrayer.upsert({
      where: {
        userId_prayerId: { userId, prayerId }
      },
      create: { userId, prayerId },
      update: {}
    });

    res.status(201).json({ saved });
  } catch (error) {
    console.error("[Via Fidei] Save prayer from prayers route error", error);
    res.status(500).json({ error: "Failed to save prayer" });
  }
});

module.exports = router;
