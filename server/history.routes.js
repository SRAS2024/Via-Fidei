// server/history.routes.js
// Church history overview and timelines for Via Fidei

const express = require("express");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Simple in memory cache for external history sections by language
const externalHistoryCache = new Map();

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

function resolveLanguage(req) {
  const override =
    req.query.language ||
    req.user?.languageOverride ||
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
    summary: h.summary || null,
    body: h.body,
    timeline: Array.isArray(h.timeline) ? h.timeline : [],
    tags: Array.isArray(h.tags) ? h.tags : [],
    source: h.source || null,
    sourceUrl: h.sourceUrl || null,
    sourceAttribution: h.sourceAttribution || null,
    updatedAt: h.updatedAt
  };
}

// Map Via Fidei canonical slugs to Wikipedia titles
const HISTORY_SECTIONS_CONFIG = [
  {
    slug: "apostolic-age",
    wikiTitle: "Apostolic Age"
  },
  {
    slug: "early-church",
    wikiTitle: "Early Christianity"
  },
  {
    slug: "councils",
    wikiTitle: "Ecumenical council"
  },
  {
    slug: "middle-ages",
    wikiTitle: "Christianity in the Middle Ages"
  },
  {
    slug: "reformation",
    wikiTitle: "Protestant Reformation"
  },
  {
    slug: "modern-era",
    wikiTitle: "Christianity in the modern era"
  },
  {
    slug: "vatican-councils",
    wikiTitle: "Second Vatican Council"
  },
  {
    slug: "contemporary-church",
    wikiTitle: "Catholic Church"
  }
];

// Canonical ordering helper
function canonicalHistoryIndex(slug) {
  if (!slug) return 999;
  const idx = HISTORY_SECTIONS_CONFIG.findIndex((s) => s.slug === slug);
  return idx === -1 ? 999 : idx;
}

// Map our supported languages to Wikipedia language codes
const WIKIPEDIA_LANG_MAP = {
  en: "en",
  es: "es",
  pt: "pt",
  fr: "fr",
  it: "it",
  de: "de",
  pl: "pl",
  ru: "ru",
  uk: "uk"
};

async function fetchWikipediaSummary(langCode, title) {
  if (typeof fetch === "undefined") {
    return null;
  }

  const url = `https://${langCode}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ViaFidei/1.0 (server history preload)"
      }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[Via Fidei] Wikipedia fetch error", langCode, title, err);
    return null;
  }
}

// Build an external history set for a language from public data
async function fetchExternalHistorySections(language) {
  const cached = externalHistoryCache.get(language);
  if (cached) {
    return cached;
  }

  const wikiLang = WIKIPEDIA_LANG_MAP[language] || "en";

  const sections = [];

  for (const config of HISTORY_SECTIONS_CONFIG) {
    const summary = await fetchWikipediaSummary(wikiLang, config.wikiTitle);
    if (!summary) continue;

    const bodyText =
      summary.extract ||
      summary.description ||
      `Overview of ${config.wikiTitle}`;

    const section = {
      id: `external-${language}-${config.slug}`,
      language,
      slug: config.slug,
      title: summary.title || config.wikiTitle,
      summary: summary.description || summary.extract || null,
      body: bodyText,
      timeline: [],
      tags: ["history", "public-source", "wikipedia"],
      source: "wikipedia",
      sourceUrl:
        (summary.content_urls &&
          summary.content_urls.desktop &&
          summary.content_urls.desktop.page) ||
        `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(
          summary.title || config.wikiTitle
        )}`,
      sourceAttribution: "Content summary based on Wikipedia",
      updatedAt: new Date()
    };

    sections.push(section);
  }

  externalHistoryCache.set(language, sections);
  return sections;
}

// Load and merge history sections from PostgreSQL and public data
async function loadHistorySections(prisma, language) {
  const [dbSections, externalSections] = await Promise.all([
    prisma.historySection.findMany({
      where: { language, isActive: true }
    }),
    fetchExternalHistorySections(language)
  ]);

  const allRaw = [...dbSections, ...externalSections];
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
    // Try database by id first
    let section = await prisma.historySection.findUnique({
      where: { id: idOrSlug }
    });

    // If not found by id, try slug plus language
    if (!section) {
      section = await prisma.historySection.findFirst({
        where: {
          slug: idOrSlug,
          language,
          isActive: true
        }
      });
    }

    if (section && section.isActive) {
      return res.json({ section: publicSection(section) });
    }

    // If not found in DB, check merged set (including Wikipedia based sections)
    const mergedSections = await loadHistorySections(prisma, language);
    const extMatch =
      mergedSections.find((s) => s.id === idOrSlug) ||
      mergedSections.find((s) => s.slug === idOrSlug);

    if (!extMatch) {
      return res.status(404).json({ error: "History section not found" });
    }

    res.json({ section: publicSection(extMatch) });
  } catch (error) {
    console.error("[Via Fidei] History section load error", error);
    res.status(500).json({ error: "Failed to load history section" });
  }
});

module.exports = router;
