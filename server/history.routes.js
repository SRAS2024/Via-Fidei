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

function publicSection(h) {
  return {
    id: h.id,
    language: h.language,
    slug: h.slug,
    title: h.title,
    summary: h.summary || null,
    body: h.body || "",
    timeline: Array.isArray(h.timeline) ? h.timeline : [],
    tags: Array.isArray(h.tags) ? h.tags : [],
    source: h.source || null,
    sourceUrl: h.sourceUrl || null,
    sourceAttribution: h.sourceAttribution || null,
    updatedAt: h.updatedAt || null
  };
}

// Canonical configuration for default sections
const HISTORY_SECTIONS_CONFIG = [
  {
    slug: "apostolic-age",
    title: "Apostolic Age",
    summary:
      "From the Resurrection of Christ through the ministry of the Apostles and the first Christian communities.",
    body: [
      "The Apostolic Age spans roughly from the Resurrection of Christ to the death of Saint John the Apostle. In this period the Gospel is first preached, the Church is born at Pentecost, and local Christian communities are established throughout the Mediterranean world.",
      "The Acts of the Apostles and the New Testament letters show the early Church learning how to live the faith in different cultures, remaining faithful to the teaching they received from Christ and the Apostles.",
      "This era is marked by missionary zeal, martyrdom, and the growth of the Church in the midst of persecution."
    ]
  },
  {
    slug: "early-church",
    title: "Early Church and Fathers",
    summary:
      "The age of the martyrs, the Church Fathers, and the first attempts to express the faith in precise language.",
    body: [
      "After the time of the Apostles, the Church spread through the Roman Empire and beyond. Christians faced recurring waves of persecution, yet the faith continued to grow through the witness of the martyrs and the courage of ordinary believers.",
      "The Fathers of the Church, such as Saint Ignatius of Antioch, Saint Irenaeus, Saint Athanasius, and Saint Augustine, defended the faith, clarified doctrine, and handed on the living Tradition of the Apostles.",
      "The early ecumenical councils, beginning with Nicaea in 325, responded to serious controversies about who Christ is and how he saves us, giving the Church creeds that are still professed today."
    ]
  },
  {
    slug: "councils",
    title: "Councils and Doctrine",
    summary:
      "Key ecumenical councils where bishops gathered to clarify and defend the faith.",
    body: [
      "Throughout history the Church has gathered in councils to respond to crises and to clarify the truths of the faith. These councils are times of intense prayer, debate, and listening to the Holy Spirit.",
      "The early councils of Nicaea, Constantinople, Ephesus, and Chalcedon defined the Church’s faith in the Trinity and in Jesus Christ, true God and true man.",
      "Later councils addressed issues such as the sacraments, grace and justification, the reform of the Church, and the relationship between faith and reason."
    ]
  },
  {
    slug: "middle-ages",
    title: "Middle Ages",
    summary:
      "A long period of growth that saw universities, religious orders, and great Gothic cathedrals.",
    body: [
      "In the Middle Ages the Church shaped the culture of Europe in deep and lasting ways. Monasteries preserved learning and prayer, while new religious orders such as the Franciscans and Dominicans brought renewal through poverty, preaching, and study.",
      "The rise of universities allowed theology and philosophy to develop in a more systematic way. Thinkers such as Saint Thomas Aquinas helped the Church articulate the harmony between faith and reason.",
      "Gothic cathedrals, liturgical music, and Christian art gave visible and audible expression to the mystery of God, inviting the faithful to lift their minds and hearts to heaven."
    ]
  },
  {
    slug: "reformation",
    title: "Reformation and Renewal",
    summary:
      "A time of deep crisis in Western Christianity that led to division and to serious reform within the Church.",
    body: [
      "In the sixteenth century, serious abuses, political conflicts, and theological disputes contributed to divisions in Western Christianity. Movements of reform, some of which broke communion with Rome, spread quickly.",
      "The Catholic Church responded with a profound work of renewal, expressed especially in the Council of Trent. This council clarified doctrine on Scripture and Tradition, the sacraments, and justification, and called for reform of Church life and discipline.",
      "New saints such as Saint Teresa of Ávila, Saint John of the Cross, and Saint Francis de Sales rebuilt the spiritual life of the Church through prayer, teaching, and example."
    ]
  },
  {
    slug: "modern-era",
    title: "Modern Era",
    summary:
      "The encounter between the Church and the modern world, including social teaching and missionary expansion.",
    body: [
      "From the eighteenth century onward, the Church entered a new relationship with the modern world. Revolutions, new philosophies, and rapid changes in society raised fresh questions about faith, freedom, and human dignity.",
      "Popes developed a rich body of Catholic social teaching, addressing issues such as the dignity of work, the rights of the poor, and the responsibilities of governments and nations.",
      "During this time missionaries carried the Gospel to many parts of the world, and local churches took deeper root in Africa, Asia, and the Americas."
    ]
  },
  {
    slug: "vatican-councils",
    title: "Vatican Councils",
    summary:
      "Vatican I and Vatican II, two councils that spoke to faith, reason, and the Church’s mission in the modern world.",
    body: [
      "The First Vatican Council (1869–1870) addressed the relationship between faith and reason in a time of rapid intellectual change, and it taught about the primacy and infallibility of the Pope when he formally defines a doctrine of faith or morals.",
      "The Second Vatican Council (1962–1965) reflected on the mystery of the Church, the liturgy, Scripture, religious freedom, and the call of all the baptized to holiness.",
      "Vatican II did not invent a new Church. It called the Church to rediscover her identity and mission, to read the signs of the times, and to present the Gospel with fresh clarity and charity."
    ]
  },
  {
    slug: "contemporary-church",
    title: "Contemporary Church",
    summary:
      "The life of the Church today, living the same faith in a global and rapidly changing world.",
    body: [
      "Today the Church is present in almost every culture and nation. Catholics worship in many languages and forms, yet profess the same Creed and celebrate the same sacraments.",
      "The Church continues to face persecution, misunderstanding, and internal weakness, yet Christ remains faithful to his promise to be with his people until the end of the age.",
      "The saints of our own time, known and unknown, show that holiness is possible in every vocation, culture, and circumstance."
    ]
  }
];

function canonicalHistoryIndex(slug) {
  if (!slug) return 999;
  const idx = HISTORY_SECTIONS_CONFIG.findIndex((s) => s.slug === slug);
  return idx === -1 ? 999 : idx;
}

// Build default history sections for a language
function buildDefaultHistory(language) {
  return HISTORY_SECTIONS_CONFIG.map((config) => ({
    id: `default-${language}-${config.slug}`,
    language,
    slug: config.slug,
    title: config.title,
    summary: config.summary,
    body: Array.isArray(config.body) ? config.body.join("\n\n") : config.body,
    timeline: [],
    tags: ["history", "overview"],
    source: "internal",
    sourceUrl: null,
    sourceAttribution: "Via Fidei default overview",
    updatedAt: null
  }));
}

// Load history sections from Prisma if possible, otherwise fall back
async function loadHistorySections(prisma, language) {
  let dbSections = [];
  try {
    if (prisma && prisma.historySection) {
      dbSections = await prisma.historySection.findMany({
        where: { language, isActive: true }
      });
    }
  } catch (err) {
    console.error("[Via Fidei] History DB load error, using defaults", err);
  }

  const allRaw =
    Array.isArray(dbSections) && dbSections.length > 0
      ? dbSections
      : buildDefaultHistory(language);

  const seen = new Set();
  const merged = [];

  for (const h of allRaw) {
    if (!h) continue;
    const slug = h.slug || null;
    const key = slug || h.id;
    if (!key) continue;
    const composite = `${language}:${key}`;
    if (seen.has(composite)) continue;
    seen.add(composite);
    merged.push(h);
  }

  merged.sort((a, b) => {
    const ai = canonicalHistoryIndex(a.slug);
    const bi = canonicalHistoryIndex(b.slug);
    if (ai === bi) {
      const at = (a.title || "").toString();
      const bt = (b.title || "").toString();
      return at.localeCompare(bt);
    }
    return ai - bi;
  });

  return merged;
}

// List all history sections for the chosen language in canonical order
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const sections = await loadHistorySections(prisma, language);

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
    let section = null;

    // Try database by id first
    try {
      if (prisma && prisma.historySection) {
        section = await prisma.historySection.findUnique({
          where: { id: idOrSlug }
        });
      }
    } catch (err) {
      console.error(
        "[Via Fidei] History findUnique error, will try slug and defaults",
        err
      );
    }

    // If not found by id, try slug plus language
    if (!section) {
      try {
        if (prisma && prisma.historySection) {
          section = await prisma.historySection.findFirst({
            where: {
              slug: idOrSlug,
              language,
              isActive: true
            }
          });
        }
      } catch (err) {
        console.error(
          "[Via Fidei] History findFirst error, will fall back to defaults",
          err
        );
      }
    }

    // If we found an active DB section, return it
    if (section && (section.isActive === undefined || section.isActive)) {
      return res.json({ section: publicSection(section) });
    }

    // Otherwise fall back to merged set (which may be just defaults)
    const mergedSections = await loadHistorySections(prisma, language);
    const match =
      mergedSections.find((s) => s.id === idOrSlug) ||
      mergedSections.find((s) => s.slug === idOrSlug);

    if (!match) {
      return res.status(404).json({ error: "History section not found" });
    }

    res.json({ section: publicSection(match) });
  } catch (error) {
    console.error("[Via Fidei] History section load error", error);
    res.status(500).json({ error: "Failed to load history section" });
  }
});

module.exports = router;
