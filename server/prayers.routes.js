// server/prayers.routes.js
// Prayers library and local search with external and built in fallbacks

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Simple in memory cache for external prayer libraries by language
const externalPrayersCache = new Map();

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

// Shape prayer for client
function publicPrayer(p) {
  return {
    id: p.id,
    language: p.language,
    slug: p.slug,
    title: p.title,
    content: p.content,
    category: p.category,
    tags: p.tags || [],
    source: p.source || null,
    sourceUrl: p.sourceUrl || null,
    sourceAttribution: p.sourceAttribution || null,
    updatedAt: p.updatedAt
  };
}

// Built in fallback library of classic prayers in English
// Used only if the database and external JSON sources are empty
function builtInPrayers(language) {
  if (language !== "en") return [];

  const now = new Date();

  const entries = [
    {
      slug: "our-father",
      title: "Our Father",
      category: "Christ centered",
      tags: ["lord's prayer", "our father", "christ", "gospel"],
      content:
        "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Catholic form of the Lord’s Prayer"
    },
    {
      slug: "hail-mary",
      title: "Hail Mary",
      category: "Marian",
      tags: ["mary", "rosary", "marian"],
      content:
        "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Catholic Hail Mary"
    },
    {
      slug: "glory-be",
      title: "Glory Be",
      category: "Trinitarian",
      tags: ["gloria", "trinity", "doxology"],
      content:
        "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Gloria Patri"
    },
    {
      slug: "apostles-creed",
      title: "Apostles’ Creed",
      category: "Creed",
      tags: ["creed", "faith", "profession of faith"],
      content:
        "I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Apostles’ Creed"
    },
    {
      slug: "act-of-contrition",
      title: "Act of Contrition",
      category: "Sacramental",
      tags: ["confession", "contrition", "penance"],
      content:
        "O my God, I am heartily sorry for having offended you, and I detest all my sins because of your just punishments, but most of all because they offend you, my God, who are all good and deserving of all my love. I firmly resolve, with the help of your grace, to sin no more and to avoid the near occasions of sin. Amen.",
      source: "built-in",
      sourceAttribution: "Common Catholic Act of Contrition"
    },
    {
      slug: "hail-holy-queen",
      title: "Hail, Holy Queen",
      category: "Marian",
      tags: ["salve regina", "mary", "marian"],
      content:
        "Hail, holy Queen, Mother of mercy, our life, our sweetness, and our hope. To you do we cry, poor banished children of Eve; to you do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, your eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of your womb, Jesus. O clement, O loving, O sweet Virgin Mary. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Salve Regina"
    },
    {
      slug: "memorare",
      title: "Memorare",
      category: "Marian",
      tags: ["memorare", "mary", "intercession"],
      content:
        "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to your protection, implored your help, or sought your intercession was left unaided. Inspired by this confidence, I fly unto you, O Virgin of virgins, my Mother. To you do I come, before you I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in your mercy hear and answer me. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Memorare"
    },
    {
      slug: "anima-christi",
      title: "Anima Christi",
      category: "Christ centered",
      tags: ["eucharist", "anima christi", "devotion"],
      content:
        "Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within your wounds hide me. Separated from you let me never be. From the evil one defend me. At the hour of my death call me and close to you bid me, that with your saints I may be praising you forever and ever. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Anima Christi"
    },
    {
      slug: "morning-offering",
      title: "Morning Offering",
      category: "Daily",
      tags: ["morning", "offering", "daily prayer"],
      content:
        "O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys, and sufferings of this day, for all the intentions of your Sacred Heart, in union with the Holy Sacrifice of the Mass throughout the world, in reparation for sins, for the intentions of all my relatives and friends, and in particular for the intentions of the Holy Father. Amen.",
      source: "built-in",
      sourceAttribution: "Common Catholic Morning Offering"
    },
    {
      slug: "guardian-angel",
      title: "Guardian Angel Prayer",
      category: "Angelic",
      tags: ["guardian angel", "angel", "protection"],
      content:
        "Angel of God, my guardian dear, to whom God’s love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.",
      source: "built-in",
      sourceAttribution: "Traditional Guardian Angel Prayer"
    }
  ];

  return entries.map((p, idx) => ({
    id: `builtin-en-${idx}`,
    language: "en",
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

// Optional external JSON source
// Configure with PRAYERS_EXTERNAL_URL or PRAYERS_EXTERNAL_URL_EN / _ES etc
async function fetchExternalPrayers(language) {
  const cached = externalPrayersCache.get(language);
  if (cached) return cached;

  const upper = language.toUpperCase();
  const specific = process.env[`PRAYERS_EXTERNAL_URL_${upper}`];
  const generic = process.env.PRAYERS_EXTERNAL_URL;
  const url = specific || generic;

  let external = [];

  if (url && typeof fetch !== "undefined") {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        external = list
          .map((raw, idx) => {
            if (!raw || typeof raw !== "object") return null;

            const title = String(raw.title || "").trim();
            const content = String(raw.content || raw.text || "").trim();
            if (!title || !content) return null;

            return {
              id: String(raw.id || `external-${language}-${idx}`),
              language,
              slug: String(
                raw.slug || title.toLowerCase().replace(/\s+/g, "-")
              ).slice(0, 120),
              title,
              content,
              category: raw.category || "Devotions",
              tags: Array.isArray(raw.tags)
                ? raw.tags.map((t) => String(t).toLowerCase())
                : [],
              source: raw.source || "external-json",
              sourceUrl: raw.sourceUrl || null,
              sourceAttribution:
                raw.sourceAttribution || "External prayer library",
              updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
            };
          })
          .filter(Boolean);
      }
    } catch (err) {
      console.error("[Via Fidei] External prayers fetch error", language, err);
    }
  }

  if (external.length === 0) {
    external = builtInPrayers(language);
  }

  externalPrayersCache.set(language, external);
  return external;
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

    if (prayers.length > 0) {
      const hasMore = prayers.length > take;
      if (hasMore) prayers.pop();

      return res.json({
        language,
        items: prayers.map(publicPrayer),
        nextCursor: hasMore ? prayers[prayers.length - 1].id : null
      });
    }

    // If database has no prayers for this language, fall back to external and built in library
    const external = await fetchExternalPrayers(language);

    return res.json({
      language,
      items: external.map(publicPrayer),
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

    const dbBase = await prisma.prayer.findMany({
      where,
      orderBy: [{ title: "asc" }, { updatedAt: "desc" }],
      take: mode === "suggest" ? 40 : 120
    });

    const external = await fetchExternalPrayers(language);

    const loweredQ = q.toLowerCase();

    const externalMatches = external.filter((p) => {
      const title = p.title.toLowerCase();
      const content = p.content.toLowerCase();
      const tags = p.tags || [];
      return (
        title.includes(loweredQ) ||
        content.includes(loweredQ) ||
        tags.some((t) => t.includes(loweredQ))
      );
    });

    const combined = [
      ...dbBase.map((p) => ({ p, origin: "db" })),
      ...externalMatches.map((p) => ({ p, origin: "external" }))
    ];

    const scored = combined
      .map(({ p, origin }) => {
        const title = p.title.toLowerCase();
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

    // Deduplicate by slug, then by id, so DB and external copies of the same prayer
    // do not show up twice in suggestions and results
    const seen = new Set();
    const ordered = [];
    for (const item of scored) {
      const p = item.p;
      const key = p.slug || p.id;
      if (!key) continue;
      const k = `${language}:${key}`;
      if (seen.has(k)) continue;
      seen.add(k);
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

    if (prayer && prayer.isActive) {
      return res.json({ prayer: publicPrayer(prayer) });
    }

    // If not found in the database, search external and built in sources
    const external = await fetchExternalPrayers(language);
    const match =
      external.find((p) => p.id === idOrSlug) ||
      external.find((p) => p.slug === idOrSlug);

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
