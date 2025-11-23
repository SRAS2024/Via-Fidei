// server/home.routes.js
// Public Home data for Via Fidei
// Mission statement, About Via Fidei, Notices, optional photo collage

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

// Public home payload
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const [mission, about, collage, notices] = await Promise.all([
      prisma.siteContent.findUnique({
        where: { language_key: { language, key: "MISSION" } }
      }),
      prisma.siteContent.findUnique({
        where: { language_key: { language, key: "ABOUT" } }
      }),
      prisma.siteContent.findUnique({
        where: { language_key: { language, key: "PHOTO_COLLAGE" } }
      }),
      prisma.notice.findMany({
        where: { language, isActive: true },
        orderBy: { displayOrder: "asc" }
      })
    ]);

    res.json({
      language,
      mission: mission?.content || null,
      about: about?.content || null,
      collage: collage?.content || null,
      notices
    });
  } catch (error) {
    console.error("[Via Fidei] Home load error", error);
    res.status(500).json({ error: "Failed to load home content" });
  }
});

module.exports = router;
