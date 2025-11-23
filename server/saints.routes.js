// server/saints.routes.js
// Saints and Our Lady (Marian apparitions) library and local search

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

function publicSaint(s) {
  return {
    id: s.id,
    language: s.language,
    slug: s.slug,
    name: s.name,
    feastDay: s.feastDay,
    patronages: s.patronages,
    biography: s.biography,
    canonizationStatus: s.canonizationStatus,
    officialPrayer: s.officialPrayer,
    imageUrl: s.imageUrl,
    tags: s.tags,
    source: s.source,
    sourceUrl: s.sourceUrl,
    sourceAttribution: s.sourceAttribution,
    updatedAt: s.updatedAt
  };
}

function publicApparition(a) {
  return {
    id: a.id,
    language: a.language,
    slug: a.slug,
    title: a.title,
    location: a.location,
    firstYear: a.firstYear,
    feastDay: a.feastDay,
    approvalNote: a.approvalNote,
    story: a.story,
    officialPrayer: a.officialPrayer,
    imageUrl: a.imageUrl,
    tags: a.tags,
    source: a.source,
    sourceUrl: a.sourceUrl,
    sourceAttribution: a.sourceAttribution,
    updatedAt: a.updatedAt
  };
}

// Lists

router.get("/saints", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const take = Math.min(Number(req.query.take) || 30, 100);
  const cursor = req.query.cursor || null;

  try {
    const where = { language, isActive: true };

    const saints = await prisma.saint.findMany({
      where,
      orderBy: { name: "asc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    const hasMore = saints.length > take;
    if (hasMore) saints.pop();

    res.json({
      language,
      items: saints.map(publicSaint),
      nextCursor: hasMore ? saints[saints.length - 1].id : null
    });
  } catch (error) {
    console.error("[Via Fidei] Saints list error", error);
    res.status(500).json({ error: "Failed to load saints" });
  }
});

router.get("/apparitions", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const take = Math.min(Number(req.query.take) || 30, 100);
  const cursor = req.query.cursor || null;

  try {
    const where = { language, isActive: true };

    const apparitions = await prisma.apparition.findMany({
      where,
      orderBy: { title: "asc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    const hasMore = apparitions.length > take;
    if (hasMore) apparitions.pop();

    res.json({
      language,
      items: apparitions.map(publicApparition),
      nextCursor: hasMore ? apparitions[apparitions.length - 1].id : null
    });
  } catch (error) {
    console.error("[Via Fidei] Apparitions list error", error);
    res.status(500).json({ error: "Failed to load apparitions" });
  }
});

// Detail pages

router.get("/saints/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let saint = await prisma.saint.findUnique({
      where: { id: idOrSlug }
    });

    if (!saint) {
      saint = await prisma.saint.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!saint || !saint.isActive) {
      return res.status(404).json({ error: "Saint not found" });
    }

    res.json({ saint: publicSaint(saint) });
  } catch (error) {
    console.error("[Via Fidei] Saint load error", error);
    res.status(500).json({ error: "Failed to load saint" });
  }
});

router.get("/apparitions/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let apparition = await prisma.apparition.findUnique({
      where: { id: idOrSlug }
    });

    if (!apparition) {
      apparition = await prisma.apparition.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (!apparition || !apparition.isActive) {
      return res.status(404).json({ error: "Apparition not found" });
    }

    res.json({ apparition: publicApparition(apparition) });
  } catch (error) {
    console.error("[Via Fidei] Apparition load error", error);
    res.status(500).json({ error: "Failed to load apparition" });
  }
});

// Local search for Saints and Our Lady
// GET /api/saints/search/local?q=...&mode=suggest|full&type=saint|apparition|all
router.get("/search/local", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const q = (req.query.q || "").toString().trim();
  const mode = (req.query.mode || "suggest").toString();
  const type = (req.query.type || "all").toString();

  if (!q) {
    return res.json({
      language,
      query: "",
      suggestions: [],
      resultsSaints: [],
      resultsApparitions: []
    });
  }

  try {
    const loweredQ = q.toLowerCase();
    const baseWhere = {
      language,
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { biography: { contains: q, mode: "insensitive" } },
        { patronages: { hasSome: [loweredQ] } },
        { tags: { hasSome: [loweredQ] } }
      ]
    };

    const baseAppWhere = {
      language,
      isActive: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { story: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [loweredQ] } }
      ]
    };

    const take = mode === "suggest" ? 8 : 50;

    const [saints, apparitions] = await Promise.all([
      type === "apparition"
        ? []
        : prisma.saint.findMany({
            where: baseWhere,
            orderBy: [{ name: "asc" }, { updatedAt: "desc" }],
            take
          }),
      type === "saint"
        ? []
        : prisma.apparition.findMany({
            where: baseAppWhere,
            orderBy: [{ title: "asc" }, { updatedAt: "desc" }],
            take
          })
    ]);

    function scoreSaint(s) {
      let score = 0;
      const name = s.name.toLowerCase();
      if (name === loweredQ) score += 100;
      else if (name.includes(loweredQ)) score += 60;

      if ((s.patronages || []).includes(loweredQ)) score += 40;
      if ((s.tags || []).includes(loweredQ)) score += 30;

      const ageMs = Date.now() - s.updatedAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - ageDays * 0.5);

      return score;
    }

    function scoreApparition(a) {
      let score = 0;
      const title = a.title.toLowerCase();
      if (title === loweredQ) score += 100;
      else if (title.includes(loweredQ)) score += 60;

      if ((a.tags || []).includes(loweredQ)) score += 40;

      const ageMs = Date.now() - a.updatedAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - ageDays * 0.5);

      return score;
    }

    const scoredSaints = saints
      .map((s) => ({ s, score: scoreSaint(s) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => publicSaint(x.s));

    const scoredApps = apparitions
      .map((a) => ({ a, score: scoreApparition(a) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => publicApparition(x.a));

    const merged = [
      ...scoredSaints.map((s) => ({
        kind: "saint",
        id: s.id,
        title: s.name,
        slug: s.slug
      })),
      ...scoredApps.map((a) => ({
        kind: "apparition",
        id: a.id,
        title: a.title,
        slug: a.slug
      }))
    ].sort((a, b) => {
      if (a.kind === b.kind) return 0;
      return a.kind === "saint" ? -1 : 1;
    });

    const suggestions = merged.slice(0, 3);

    res.json({
      language,
      query: q,
      suggestions,
      resultsSaints: mode === "full" ? scoredSaints : [],
      resultsApparitions: mode === "full" ? scoredApps : []
    });
  } catch (error) {
    console.error("[Via Fidei] Saints search error", error);
    res.status(500).json({ error: "Failed to search saints and apparitions" });
  }
});

// Saving saints and apparitions from this section

router.post("/saints/:saintId/save", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { saintId } = req.params;

  try {
    const saved = await prisma.savedSaint.upsert({
      where: { userId_saintId: { userId, saintId } },
      create: { userId, saintId },
      update: {}
    });

    res.status(201).json({ saved });
  } catch (error) {
    console.error("[Via Fidei] Save saint from saints route error", error);
    res.status(500).json({ error: "Failed to save saint" });
  }
});

router.post("/apparitions/:apparitionId/save", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { apparitionId } = req.params;

  try {
    const saved = await prisma.savedApparition.upsert({
      where: { userId_apparitionId: { userId, apparitionId } },
      create: { userId, apparitionId },
      update: {}
    });

    res.status(201).json({ saved });
  } catch (error) {
    console.error("[Via Fidei] Save apparition from saints route error", error);
    res.status(500).json({ error: "Failed to save apparition" });
  }
});

module.exports = router;
