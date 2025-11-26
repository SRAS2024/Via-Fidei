// server/saints.routes.js
// Saints and Our Lady (Marian apparitions) library and local search
// Database first, then external JSON, then built in canonical entries.

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Simple in memory caches for external libraries
const externalSaintsCache = new Map();
const externalApparitionsCache = new Map();

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
    patronages: s.patronages || [],
    biography: s.biography,
    canonizationStatus: s.canonizationStatus,
    officialPrayer: s.officialPrayer,
    imageUrl: s.imageUrl,
    tags: s.tags || [],
    source: s.source || null,
    sourceUrl: s.sourceUrl || null,
    sourceAttribution: s.sourceAttribution || null,
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
    tags: a.tags || [],
    source: a.source || null,
    sourceUrl: a.sourceUrl || null,
    sourceAttribution: a.sourceAttribution || null,
    updatedAt: a.updatedAt
  };
}

// Built in canonical saints library for English
function builtInSaints(language) {
  if (language !== "en") return [];

  const now = new Date();

  const entries = [
    {
      slug: "saint-joseph-spouse-of-the-blessed-virgin-mary",
      name: "Saint Joseph, Spouse of the Blessed Virgin Mary",
      feastDay: "0000-03-19",
      patronages: ["families", "workers", "universal church", "fathers"],
      canonizationStatus: "Canonized",
      biography:
        "Saint Joseph, the just and silent guardian of the Holy Family, was chosen by God to be the foster father of Jesus and the chaste spouse of the Blessed Virgin Mary. Though the Gospels record no words of Joseph, they show him as a man of deep faith, prompt obedience, and courageous protection. He welcomed the mystery of the Incarnation into his home and labored humbly as a carpenter, supporting Mary and the Child with the work of his hands.\n\nIn every scene where he appears, Joseph listens for the voice of God and responds without hesitation. He takes Mary into his home, protects the Child from Herod by fleeing into Egypt, and returns only when the Lord commands. His hidden life in Nazareth reveals the dignity of ordinary work offered to God and the sanctity of family life lived in quiet fidelity.\n\nThe Church venerates Saint Joseph as Patron of the Universal Church, protector of families, workers, and the dying. His example invites the faithful to a life of humble strength, purity of heart, and total trust in Divine Providence.",
      officialPrayer:
        "O Saint Joseph, spouse of the Blessed Virgin Mary and foster father of our Lord Jesus Christ, guardian of the Holy Family, protect our homes and families. Obtain for us a spirit of humble obedience, purity of heart, and generous fidelity to God’s will. Pray for us, that we may live and die in the friendship of your Son and enter the joy of heaven. Amen.",
      imageUrl: null,
      tags: ["saint joseph", "holy family", "workers", "fathers"],
      source: "built-in",
      sourceAttribution: "Traditional Catholic devotion to Saint Joseph"
    },
    {
      slug: "saint-francis-of-assisi",
      name: "Saint Francis of Assisi",
      feastDay: "0000-10-04",
      patronages: ["animals", "creation", "italy", "peace"],
      canonizationStatus: "Canonized",
      biography:
        "Saint Francis of Assisi, born into a wealthy merchant family, encountered Christ and chose a life of radical poverty, simplicity, and joy. He became a living image of the Gospel, embracing lepers, begging for the poor, repairing churches, and proclaiming peace. His love for Christ crucified led him to embrace suffering and to see all creation as a reflection of God’s goodness.\n\nFrancis founded the Order of Friars Minor, inspiring men and women to live the Gospel without compromise, relying entirely on God’s providence. His joyful humility drew countless people back to the sacraments, rekindling love for the Church and her Lord. His Canticle of the Creatures reveals a heart that saw brotherhood and sisterhood in all that God made.\n\nThe Church honors Saint Francis as patron of ecology and peace. His life calls the faithful to conversion, mercy, reverence for creation, and a trust in God that frees the soul from attachment to earthly wealth.",
      officialPrayer:
        "Most High, glorious God, enlighten the darkness of my heart and give me true faith, certain hope, and perfect charity, sense and knowledge, Lord, that I may carry out Your holy and true command. Saint Francis of Assisi, pray for us. Amen.",
      imageUrl: null,
      tags: ["francis", "poverty", "creation", "peace"],
      source: "built-in",
      sourceAttribution: "Inspired by early Franciscan sources"
    },
    {
      slug: "saint-therese-of-lisieux",
      name: "Saint Thérèse of Lisieux",
      feastDay: "0000-10-01",
      patronages: ["missions", "france", "trust", "childlike faith"],
      canonizationStatus: "Doctor of the Church",
      biography:
        "Saint Thérèse of the Child Jesus and the Holy Face, known as the Little Flower, entered the Carmelite monastery of Lisieux at a young age and lived a hidden life of prayer, sacrifice, and love. Without great external works, she discovered a Little Way of spiritual childhood, trusting entirely in God’s mercy and offering every small act with great love.\n\nHer autobiography, Story of a Soul, reveals a soul marked by deep humility, ardent charity, and unwavering confidence in the Father’s tenderness. Through daily fidelity in ordinary duties, she reached the heights of sanctity and offered herself as a victim of merciful love for the salvation of souls.\n\nProclaimed a Doctor of the Church, Saint Thérèse is patroness of the missions and a guide for all who feel small or hidden. Her Little Way invites believers to trust that holiness is possible in the ordinary tasks of daily life when done with love for Jesus.",
      officialPrayer:
        "Saint Thérèse of the Child Jesus and the Holy Face, Little Flower of Jesus, teach us your Little Way of trust and love. Help us to offer every moment, every sacrifice, and every joy for love of God and the salvation of souls. Intercede for us, that we may love Jesus with your childlike confidence and rejoice forever in His mercy. Amen.",
      imageUrl: null,
      tags: ["therese", "little way", "trust", "mercy"],
      source: "built-in",
      sourceAttribution: "Inspired by Story of a Soul"
    },
    {
      slug: "saint-john-paul-ii",
      name: "Saint John Paul II",
      feastDay: "0000-10-22",
      patronages: ["youth", "families", "world youth day"],
      canonizationStatus: "Canonized",
      biography:
        "Saint John Paul II, born Karol Wojtyła in Poland, lived through war, totalitarian regimes, and persecution, yet emerged as a tireless witness to the dignity of the human person. As priest, bishop, and pope, he proclaimed Christ as the Redeemer of man, calling the Church and the world to be not afraid and to open wide the doors to Christ.\n\nHis pontificate was marked by deep Marian devotion, a robust defense of life and family, and a passionate engagement with culture, philosophy, and youth. He traveled across the globe, celebrated World Youth Day, and authored encyclicals that explored faith, reason, morality, and the mystery of God’s mercy.\n\nThe Church venerates Saint John Paul II as a pastor who united fidelity to tradition with courageous engagement with the modern world. His life teaches believers to trust in Divine Mercy, to defend the vulnerable, and to offer one’s gifts generously in service of the Gospel.",
      officialPrayer:
        "Saint John Paul II, faithful shepherd of the Church, intercede for us, that we may open wide the doors to Christ. Obtain for us a living faith, a courageous hope, and a love that is ready to sacrifice for the dignity of every human person. Pray that we may proclaim the Gospel with joy and stand firm in truth and charity. Amen.",
      imageUrl: null,
      tags: ["john paul ii", "mercy", "youth", "family"],
      source: "built-in",
      sourceAttribution: "Inspired by papal homilies and writings"
    }
  ];

  return entries.map((s, idx) => ({
    id: `builtin-saint-en-${idx}`,
    language: "en",
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
    sourceUrl: null,
    sourceAttribution: s.sourceAttribution,
    updatedAt: now
  }));
}

// Built in Marian apparitions library for English
function builtInApparitions(language) {
  if (language !== "en") return [];

  const now = new Date();

  const entries = [
    {
      slug: "our-lady-of-fatima",
      title: "Our Lady of Fátima",
      location: "Fátima, Portugal",
      firstYear: 1917,
      feastDay: "0000-05-13",
      approvalNote:
        "Apparitions to three shepherd children in 1917, approved by the Church and widely venerated.",
      story:
        "In 1917, in the small village of Fátima in Portugal, the Blessed Virgin Mary appeared to three shepherd children, Lucia, Francisco, and Jacinta. She called the world to prayer, penance, and conversion, urging devotion to her Immaculate Heart and the daily recitation of the Rosary for peace and the salvation of souls.\n\nOver several months, Our Lady entrusted messages concerning the need for repentance, the suffering of the Church, and the mercy of God. The apparitions culminated in the Miracle of the Sun, witnessed by thousands, which confirmed Heaven’s intervention in a dramatic and public way.\n\nOur Lady of Fátima continues to inspire the faithful to pray the Rosary, offer sacrifices for sinners, and entrust themselves to her maternal care. Her message is a call to hope, confident trust, and a deeper love for Christ present in the Church.",
      officialPrayer:
        "O Most Holy Virgin Mary, Queen of the Rosary of Fátima, you were pleased to appear to the children of Fátima and reveal the treasures of grace hidden in the Rosary. Inspire our hearts with a sincere love for this devotion, that by meditating on the mysteries of our redemption we may obtain the graces we ask for. Our Lady of Fátima, pray for us. Amen.",
      imageUrl: null,
      tags: ["fatima", "our lady", "rosary", "conversion"],
      source: "built-in",
      sourceAttribution: "Based on the approved apparitions of Fátima"
    },
    {
      slug: "our-lady-of-lourdes",
      title: "Our Lady of Lourdes",
      location: "Lourdes, France",
      firstYear: 1858,
      feastDay: "0000-02-11",
      approvalNote:
        "Apparitions to Saint Bernadette Soubirous in 1858, approved by the Church and associated with many healings.",
      story:
        "In 1858, the Blessed Virgin Mary appeared to a poor young girl, Bernadette Soubirous, in the grotto of Massabielle near Lourdes in France. Mary identified herself as the Immaculate Conception and invited Bernadette to prayer, penance, and the discovery of a spring of water that would become a source of physical and spiritual healing.\n\nThroughout the apparitions, Our Lady spoke with gentleness and maternal concern, calling sinners to conversion and the Church to renewed trust in God’s mercy. The waters of Lourdes have since been associated with countless healings, many of which have been thoroughly investigated and recognized.\n\nOur Lady of Lourdes is venerated as a mother who draws the sick, the suffering, and the poor to the heart of Christ. Her sanctuary remains a place of pilgrimage, confession, Eucharistic adoration, and compassionate care for the most vulnerable.",
      officialPrayer:
        "O ever Immaculate Virgin, Mother of mercy, Our Lady of Lourdes, you who appeared to Bernadette in the grotto of Massabielle, we ask your intercession. Obtain for us the grace of conversion, healing of soul and body, and a deeper trust in your Son Jesus. Our Lady of Lourdes, health of the sick, pray for us. Amen.",
      imageUrl: null,
      tags: ["lourdes", "healing", "our lady", "immaculate conception"],
      source: "built-in",
      sourceAttribution: "Based on the approved apparitions of Lourdes"
    },
    {
      slug: "our-lady-of-guadalupe",
      title: "Our Lady of Guadalupe",
      location: "Tepeyac, Mexico",
      firstYear: 1531,
      feastDay: "0000-12-12",
      approvalNote:
        "Apparitions to Saint Juan Diego in 1531, honored as Patroness of the Americas and the unborn.",
      story:
        "In 1531, the Blessed Virgin Mary appeared to Saint Juan Diego on the hill of Tepeyac near present day Mexico City. She came as a gentle mother, clothed in native symbols, and spoke in Juan Diego’s own language, asking that a church be built where she might show her love and compassion to all who seek her Son.\n\nAs a sign for the bishop, Mary caused roses to bloom in winter and imprinted her image miraculously on Juan Diego’s tilma. This image, rich in symbolic meaning, led to the conversion of countless indigenous peoples and remains a powerful witness to the dignity of every human life.\n\nOur Lady of Guadalupe is venerated as Patroness of the Americas and the unborn. Her message is one of tenderness, protection, and evangelization, inviting all people to trust that they are seen, known, and loved by God.",
      officialPrayer:
        "Our Lady of Guadalupe, Mother of the true God and Mother of the Church, look with mercy upon us and upon all who seek your help. Gather us under your mantle of protection, guide us to your Son Jesus, and obtain for us the grace to defend the dignity of every human person. Our Lady of Guadalupe, pray for us. Amen.",
      imageUrl: null,
      tags: ["guadalupe", "americas", "our lady", "life"],
      source: "built-in",
      sourceAttribution: "Based on the approved apparitions of Guadalupe"
    }
  ];

  return entries.map((a, idx) => ({
    id: `builtin-apparition-en-${idx}`,
    language: "en",
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
    sourceUrl: null,
    sourceAttribution: a.sourceAttribution,
    updatedAt: now
  }));
}

// Optional external saints JSON
// Configure via SAINTS_EXTERNAL_URL or SAINTS_EXTERNAL_URL_EN / _ES etc
async function fetchExternalSaints(language) {
  const cached = externalSaintsCache.get(language);
  if (cached) return cached;

  const upper = language.toUpperCase();
  const specific = process.env[`SAINTS_EXTERNAL_URL_${upper}`];
  const generic = process.env.SAINTS_EXTERNAL_URL;
  const url = specific || generic;

  let external = [];

  if (url && typeof fetch !== "undefined") {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
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

            const name = String(raw.name || raw.title || "").trim();
            const biography = String(raw.biography || raw.life || "").trim();
            if (!name || !biography) return null;

            const slugBase =
              raw.slug ||
              name
                .toLowerCase()
                .replace(/[^a-z0-9\s\-]/g, "")
                .replace(/\s+/g, "-");

            return {
              id: String(raw.id || `external-saint-${language}-${idx}`),
              language,
              slug: String(slugBase).slice(0, 140),
              name,
              feastDay: raw.feastDay || null,
              patronages: Array.isArray(raw.patronages)
                ? raw.patronages.map((p) => String(p).toLowerCase())
                : [],
              biography,
              canonizationStatus: raw.canonizationStatus || raw.status || null,
              officialPrayer: raw.officialPrayer || raw.prayer || null,
              imageUrl: raw.imageUrl || raw.icon || null,
              tags: Array.isArray(raw.tags)
                ? raw.tags.map((t) => String(t).toLowerCase())
                : [],
              source: raw.source || "external-json",
              sourceUrl: raw.sourceUrl || null,
              sourceAttribution:
                raw.sourceAttribution || "External saints library",
              updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
            };
          })
          .filter(Boolean);
      }
    } catch (err) {
      console.error("[Via Fidei] External saints fetch error", language, err);
    }
  }

  if (external.length === 0) {
    external = builtInSaints(language);
  }

  externalSaintsCache.set(language, external);
  return external;
}

// Optional external apparitions JSON
// Configure via APPARITIONS_EXTERNAL_URL or APPARITIONS_EXTERNAL_URL_EN / _ES etc
async function fetchExternalApparitions(language) {
  const cached = externalApparitionsCache.get(language);
  if (cached) return cached;

  const upper = language.toUpperCase();
  const specific = process.env[`APPARITIONS_EXTERNAL_URL_${upper}`];
  const generic = process.env.APPARITIONS_EXTERNAL_URL;
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
            const story = String(raw.story || raw.description || "").trim();
            if (!title || !story) return null;

            const slugBase =
              raw.slug ||
              title
                .toLowerCase()
                .replace(/[^a-z0-9\s\-]/g, "")
                .replace(/\s+/g, "-");

            return {
              id: String(raw.id || `external-apparition-${language}-${idx}`),
              language,
              slug: String(slugBase).slice(0, 140),
              title,
              location: raw.location || null,
              firstYear: raw.firstYear || raw.year || null,
              feastDay: raw.feastDay || null,
              approvalNote: raw.approvalNote || raw.approval || null,
              story,
              officialPrayer: raw.officialPrayer || raw.prayer || null,
              imageUrl: raw.imageUrl || raw.icon || null,
              tags: Array.isArray(raw.tags)
                ? raw.tags.map((t) => String(t).toLowerCase())
                : [],
              source: raw.source || "external-json",
              sourceUrl: raw.sourceUrl || null,
              sourceAttribution:
                raw.sourceAttribution || "External apparitions library",
              updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
            };
          })
          .filter(Boolean);
      }
    } catch (err) {
      console.error(
        "[Via Fidei] External apparitions fetch error",
        language,
        err
      );
    }
  }

  if (external.length === 0) {
    external = builtInApparitions(language);
  }

  externalApparitionsCache.set(language, external);
  return external;
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

    if (saints.length > 0) {
      const hasMore = saints.length > take;
      if (hasMore) saints.pop();

      return res.json({
        language,
        items: saints.map(publicSaint),
        nextCursor: hasMore ? saints[saints.length - 1].id : null
      });
    }

    const external = await fetchExternalSaints(language);

    return res.json({
      language,
      items: external.map(publicSaint),
      nextCursor: null
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

    if (apparitions.length > 0) {
      const hasMore = apparitions.length > take;
      if (hasMore) apparitions.pop();

      return res.json({
        language,
        items: apparitions.map(publicApparition),
        nextCursor: hasMore ? apparitions[apparitions.length - 1].id : null
      });
    }

    const external = await fetchExternalApparitions(language);

    return res.json({
      language,
      items: external.map(publicApparition),
      nextCursor: null
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

    if (saint && saint.isActive) {
      return res.json({ saint: publicSaint(saint) });
    }

    const external = await fetchExternalSaints(language);
    const match =
      external.find((s) => s.id === idOrSlug) ||
      external.find((s) => s.slug === idOrSlug);

    if (!match) {
      return res.status(404).json({ error: "Saint not found" });
    }

    res.json({ saint: publicSaint(match) });
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

    if (apparition && apparition.isActive) {
      return res.json({ apparition: publicApparition(apparition) });
    }

    const external = await fetchExternalApparitions(language);
    const match =
      external.find((a) => a.id === idOrSlug) ||
      external.find((a) => a.slug === idOrSlug);

    if (!match) {
      return res.status(404).json({ error: "Apparition not found" });
    }

    res.json({ apparition: publicApparition(match) });
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

    const baseWhereSaint = {
      language,
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { biography: { contains: q, mode: "insensitive" } },
        { patronages: { hasSome: [loweredQ] } },
        { tags: { hasSome: [loweredQ] } }
      ]
    };

    const baseWhereApp = {
      language,
      isActive: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { story: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [loweredQ] } }
      ]
    };

    const take = mode === "suggest" ? 30 : 80;

    const [dbSaints, dbApps, externalSaints, externalApps] = await Promise.all([
      type === "apparition"
        ? Promise.resolve([])
        : prisma.saint.findMany({
            where: baseWhereSaint,
            orderBy: [{ name: "asc" }, { updatedAt: "desc" }],
            take
          }),
      type === "saint"
        ? Promise.resolve([])
        : prisma.apparition.findMany({
            where: baseWhereApp,
            orderBy: [{ title: "asc" }, { updatedAt: "desc" }],
            take
          }),
      type === "apparition"
        ? Promise.resolve([])
        : fetchExternalSaints(language),
      type === "saint"
        ? Promise.resolve([])
        : fetchExternalApparitions(language)
    ]);

    const externalSaintMatches = externalSaints.filter((s) => {
      const name = s.name.toLowerCase();
      const bio = (s.biography || "").toLowerCase();
      const tags = s.tags || [];
      const patronages = s.patronages || [];
      return (
        name.includes(loweredQ) ||
        bio.includes(loweredQ) ||
        tags.some((t) => t.includes(loweredQ)) ||
        patronages.some((p) => p.includes(loweredQ))
      );
    });

    const externalAppMatches = externalApps.filter((a) => {
      const title = a.title.toLowerCase();
      const story = (a.story || "").toLowerCase();
      const location = (a.location || "").toLowerCase();
      const tags = a.tags || [];
      return (
        title.includes(loweredQ) ||
        story.includes(loweredQ) ||
        location.includes(loweredQ) ||
        tags.some((t) => t.includes(loweredQ))
      );
    });

    function scoreSaint(s, origin) {
      let score = 0;
      const name = s.name.toLowerCase();
      if (name === loweredQ) score += 110;
      else if (name.includes(loweredQ)) score += 70;

      if ((s.patronages || []).includes(loweredQ)) score += 40;
      if ((s.tags || []).includes(loweredQ)) score += 30;

      if (origin === "db") score += 12;
      else score += 6;

      const updated = s.updatedAt instanceof Date ? s.updatedAt : new Date();
      const ageMs = Date.now() - updated.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      score += Math.max(0, 18 - ageDays * 0.4);

      return score;
    }

    function scoreApparition(a, origin) {
      let score = 0;
      const title = a.title.toLowerCase();
      if (title === loweredQ) score += 110;
      else if (title.includes(loweredQ)) score += 70;

      if ((a.tags || []).includes(loweredQ)) score += 35;
      if ((a.location || "").toLowerCase().includes(loweredQ)) score += 25;

      if (origin === "db") score += 12;
      else score += 6;

      const updated = a.updatedAt instanceof Date ? a.updatedAt : new Date();
      const ageMs = Date.now() - updated.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      score += Math.max(0, 18 - ageDays * 0.4);

      return score;
    }

    const combinedSaints = [
      ...dbSaints.map((s) => ({ s, origin: "db" })),
      ...externalSaintMatches.map((s) => ({ s, origin: "external" }))
    ];

    const combinedApps = [
      ...dbApps.map((a) => ({ a, origin: "db" })),
      ...externalAppMatches.map((a) => ({ a, origin: "external" }))
    ];

    const scoredSaintsRaw = combinedSaints
      .map(({ s, origin }) => ({ s, score: scoreSaint(s, origin) }))
      .sort((a, b) => b.score - a.score);

    const scoredAppsRaw = combinedApps
      .map(({ a, origin }) => ({ a, score: scoreApparition(a, origin) }))
      .sort((a, b) => b.score - a.score);

    // Deduplicate saints by slug then id
    const saintSeen = new Set();
    const uniqueSaints = [];
    for (const { s } of scoredSaintsRaw) {
      const key = s.slug || s.id || s.name.toLowerCase();
      if (!key) continue;
      const k = `${language}:saint:${key}`;
      if (saintSeen.has(k)) continue;
      saintSeen.add(k);
      uniqueSaints.push(publicSaint(s));
    }

    // Deduplicate apparitions by slug then id
    const appSeen = new Set();
    const uniqueApps = [];
    for (const { a } of scoredAppsRaw) {
      const key = a.slug || a.id || a.title.toLowerCase();
      if (!key) continue;
      const k = `${language}:apparition:${key}`;
      if (appSeen.has(k)) continue;
      appSeen.add(k);
      uniqueApps.push(publicApparition(a));
    }

    const mergedForSuggestions = [
      ...uniqueSaints.map((s) => ({
        kind: "saint",
        id: s.id,
        title: s.name,
        slug: s.slug
      })),
      ...uniqueApps.map((a) => ({
        kind: "apparition",
        id: a.id,
        title: a.title,
        slug: a.slug
      }))
    ];

    const suggestions = mergedForSuggestions.slice(0, 3);

    res.json({
      language,
      query: q,
      suggestions,
      resultsSaints: mode === "full" ? uniqueSaints : [],
      resultsApparitions: mode === "full" ? uniqueApps : []
    });
  } catch (error) {
    console.error("[Via Fidei] Saints search error", error);
    res
      .status(500)
      .json({ error: "Failed to search saints and apparitions" });
  }
});

// Saving saints and apparitions for the current user

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

router.post(
  "/apparitions/:apparitionId/save",
  requireAuth,
  async (req, res) => {
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
      console.error(
        "[Via Fidei] Save apparition from saints route error",
        error
      );
      res.status(500).json({ error: "Failed to save apparition" });
    }
  }
);

module.exports = router;
