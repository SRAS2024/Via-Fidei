// server/prayers.routes.js
// Prayers library and local search with built in fallbacks

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

// Shape prayer for client
function publicPrayer(p) {
  return {
    id: p.id,
    language: p.language,
    slug: p.slug,
    title: p.title,
    content: p.content,
    category: p.category,
    tags: Array.isArray(p.tags) ? p.tags : [],
    source: p.source || null,
    sourceUrl: p.sourceUrl || null,
    sourceAttribution: p.sourceAttribution || null,
    updatedAt: p.updatedAt || null
  };
}

// Built in fallback library of classic prayers
// Used whenever the database is empty for a language
function builtInPrayers(language) {
  const now = new Date();
  const lang = SUPPORTED_LANGS.includes(language) ? language : "en";

  const entries = [
    {
      slug: "our-father",
      title: "Our Father",
      category: "Christ centered",
      tags: ["lord's prayer", "our father", "christ", "gospel"],
      content:
        "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. " +
        "Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; " +
        "and lead us not into temptation, but deliver us from evil. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Catholic form of the Lord’s Prayer"
    },
    {
      slug: "hail-mary",
      title: "Hail Mary",
      category: "Marian",
      tags: ["mary", "rosary", "marian"],
      content:
        "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, " +
        "and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, " +
        "now and at the hour of our death. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Catholic Hail Mary"
    },
    {
      slug: "glory-be",
      title: "Glory Be",
      category: "Trinitarian",
      tags: ["gloria", "trinity", "doxology"],
      content:
        "Glory be to the Father, and to the Son, and to the Holy Spirit. " +
        "As it was in the beginning, is now, and ever shall be, world without end. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Gloria Patri"
    },
    {
      slug: "apostles-creed",
      title: "Apostles’ Creed",
      category: "Creed",
      tags: ["creed", "faith", "profession of faith"],
      content:
        "I believe in God, the Father almighty, Creator of heaven and earth, " +
        "and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, " +
        "born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; " +
        "he descended into hell; on the third day he rose again from the dead; he ascended into heaven, " +
        "and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. " +
        "I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, " +
        "the resurrection of the body, and life everlasting. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Apostles’ Creed"
    },
    {
      slug: "act-of-contrition",
      title: "Act of Contrition",
      category: "Sacramental",
      tags: ["confession", "contrition", "penance"],
      content:
        "O my God, I am heartily sorry for having offended you, and I detest all my sins because of your just punishments, " +
        "but most of all because they offend you, my God, who are all good and deserving of all my love. " +
        "I firmly resolve, with the help of your grace, to sin no more and to avoid the near occasions of sin. Amen.",
      source: "built-in",
      sourceAttribution: "Common Catholic Act of Contrition"
    },
    {
      slug: "hail-holy-queen",
      title: "Hail, Holy Queen",
      category: "Marian",
      tags: ["salve regina", "mary", "marian"],
      content:
        "Hail, holy Queen, Mother of mercy, our life, our sweetness, and our hope. " +
        "To you do we cry, poor banished children of Eve; to you do we send up our sighs, " +
        "mourning and weeping in this valley of tears. Turn then, most gracious advocate, your eyes of mercy toward us, " +
        "and after this our exile, show unto us the blessed fruit of your womb, Jesus. " +
        "O clement, O loving, O sweet Virgin Mary. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Salve Regina"
    },
    {
      slug: "memorare",
      title: "Memorare",
      category: "Marian",
      tags: ["memorare", "mary", "intercession"],
      content:
        "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to your protection, " +
        "implored your help, or sought your intercession was left unaided. Inspired by this confidence, I fly unto you, " +
        "O Virgin of virgins, my Mother. To you do I come, before you I stand, sinful and sorrowful. " +
        "O Mother of the Word Incarnate, despise not my petitions, but in your mercy hear and answer me. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Memorare"
    },
    {
      slug: "anima-christi",
      title: "Anima Christi",
      category: "Christ centered",
      tags: ["eucharist", "anima christi", "devotion"],
      content:
        "Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. " +
        "Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. " +
        "Within your wounds hide me. Separated from you let me never be. From the evil one defend me. " +
        "At the hour of my death call me and close to you bid me, that with your saints I may be praising you forever and ever. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Anima Christi"
    },
    {
      slug: "morning-offering",
      title: "Morning Offering",
      category: "Daily",
      tags: ["morning", "offering", "daily prayer"],
      content:
        "O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys, and sufferings of this day, " +
        "for all the intentions of your Sacred Heart, in union with the Holy Sacrifice of the Mass throughout the world, " +
        "in reparation for sins, for the intentions of all my relatives and friends, and in particular for the intentions of the Holy Father. Amen.",
      source: "built-in",
      sourceAttribution: "Common Catholic Morning Offering"
    },
    {
      slug: "guardian-angel",
      title: "Guardian Angel Prayer",
      category: "Angelic",
      tags: ["guardian angel", "angel", "protection"],
      content:
        "Angel of God, my guardian dear, to whom God’s love commits me here, ever this day be at my side, " +
        "to light and guard, to rule and guide. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Guardian Angel Prayer"
    }
  ];

  return entries.map((p, idx) => ({
    id: `builtin-${lang}-${idx}`,
    language: lang,
    slug: p.slug,
    title: p.title,
    content: p.content,
    category: p.category,
    tags: p.tags,
    source: p.source,
    sourceUrl: null,
    sourceAttribution: p.sourceAttribution,
    updatedAt: now
  }));
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

    let prayers = [];
    try {
      prayers = await prisma.prayer.findMany({
        where,
        orderBy: { title: "asc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
      });
    } catch (err) {
      console.error("[Via Fidei] Prayers DB list error, using built in", err);
    }

    if (Array.isArray(prayers) && prayers.length > 0) {
      const hasMore = prayers.length > take;
      if (hasMore) prayers.pop();

      return res.json({
        language,
        items: prayers.map(publicPrayer),
        nextCursor: hasMore ? prayers[prayers.length - 1].id : null
      });
    }

    // If database has no prayers for this language, fall back to built in library
    const builtIns = builtInPrayers(language);

    return res.json({
      language,
      items: builtIns.map(publicPrayer),
      nextCursor: null
    });
  } catch (error) {
    console.error("[Via Fidei] Prayers list error", error);
    res.status(500).json({ error: "Failed to load prayers" });
  }
});

// Local search inside Prayers
// GET /api/prayers/search/local?q=...&mode=suggest|full
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

    let dbBase = [];
    try {
      dbBase = await prisma.prayer.findMany({
        where,
        orderBy: [{ title: "asc" }, { updatedAt: "desc" }],
        take: mode === "suggest" ? 40 : 120
      });
    } catch (err) {
      console.error("[Via Fidei] Prayers DB search error, will use built in only", err);
    }

    const builtIns = builtInPrayers(language);
    const loweredQ = q.toLowerCase();

    const builtInMatches = builtIns.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const content = (p.content || "").toLowerCase();
      const tags = p.tags || [];
      return (
        title.includes(loweredQ) ||
        content.includes(loweredQ) ||
        tags.some((t) => t.includes(loweredQ))
      );
    });

    const combined = [
      ...dbBase.map((p) => ({ p, origin: "db" })),
      ...builtInMatches.map((p) => ({ p, origin: "builtin" }))
    ];

    const scored = combined
      .map(({ p, origin }) => {
        const title = (p.title || "").toLowerCase();
        let score = 0;

        if (title === loweredQ) score += 120;
        else if (title.includes(loweredQ)) score += 80;

        const tags = p.tags || [];
        if (tags.includes(loweredQ)) score += 40;

        if (origin === "db") score += 10;
        else score += 5;

        const updated = p.updatedAt instanceof Date ? p.updatedAt : new Date();
        const ageMs = Date.now() - updated.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        score += Math.max(0, 20 - ageDays * 0.5);

        return { p, score };
      })
      .sort((a, b) => b.score - a.score);

    // Deduplicate by slug or id
    const seen = new Set();
    const ordered = [];
    for (const item of scored) {
      const p = item.p;
      const key = p.slug || p.id;
      if (!key) continue;
      const composite = `${language}:${key}`;
      if (seen.has(composite)) continue;
      seen.add(composite);
      ordered.push(publicPrayer(p));
    }

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

// Get a single prayer by id or slug
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let prayer = null;

    try {
      prayer = await prisma.prayer.findUnique({
        where: { id: idOrSlug }
      });
    } catch (err) {
      console.error(
        "[Via Fidei] Prayer findUnique by id error, will try slug and defaults",
        err
      );
    }

    if (!prayer) {
      try {
        prayer = await prisma.prayer.findUnique({
          where: {
            slug_language: {
              slug: idOrSlug,
              language
            }
          }
        });
      } catch (err) {
        console.error(
          "[Via Fidei] Prayer findUnique by slug_language error, will fall back to built in",
          err
        );
      }
    }

    if (prayer && (prayer.isActive === undefined || prayer.isActive)) {
      return res.json({ prayer: publicPrayer(prayer) });
    }

    const builtIns = builtInPrayers(language);
    const match =
      builtIns.find((p) => p.id === idOrSlug) ||
      builtIns.find((p) => p.slug === idOrSlug);

    if (!match) {
      return res.status(404).json({ error: "Prayer not found" });
    }

    return res.json({ prayer: publicPrayer(match) });
  } catch (error) {
    console.error("[Via Fidei] Prayer load error", error);
    res.status(500).json({ error: "Failed to load prayer" });
  }
});

// Save a prayer for the current user
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
