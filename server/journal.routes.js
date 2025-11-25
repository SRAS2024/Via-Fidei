// server/journal.routes.js
// Spiritual journal for Via Fidei
// All entries are private per user and stored safely in PostgreSQL.

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

function normalizeTags(tags) {
  if (!tags) return [];
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t || "").trim())
    .filter(Boolean);
}

function publicEntry(e) {
  return {
    id: e.id,
    userId: e.userId,
    language: e.language,
    title: e.title,
    content: e.content,
    tags: Array.isArray(e.tags) ? e.tags : [],
    isArchived: Boolean(e.isArchived),
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
  };
}

// List journal entries for current user
// GET /api/journal?archived=false|true|all&take=20&cursor=<id>
router.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const language = resolveLanguage(req);

  const archivedParam = (req.query.archived || "false").toString();
  const take = Math.min(Number(req.query.take) || 20, 100);
  const cursor = req.query.cursor || null;

  let archivedFilter = {};
  if (archivedParam === "true") {
    archivedFilter = { isArchived: true };
  } else if (archivedParam === "false") {
    archivedFilter = { isArchived: false };
  }

  try {
    const where = {
      userId,
      language,
      ...archivedFilter
    };

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    const hasMore = entries.length > take;
    if (hasMore) {
      entries.pop();
    }

    res.json({
      language,
      items: entries.map(publicEntry),
      nextCursor: hasMore ? entries[entries.length - 1].id : null
    });
  } catch (error) {
    console.error("[Via Fidei] Journal list error", error);
    res.status(500).json({ error: "Failed to load journal entries" });
  }
});

// Load a single entry, owner only
// GET /api/journal/:id
router.get("/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!entry || entry.userId !== userId) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json({ entry: publicEntry(entry) });
  } catch (error) {
    console.error("[Via Fidei] Journal load error", error);
    res.status(500).json({ error: "Failed to load journal entry" });
  }
});

// Create a new entry
// POST /api/journal
// { title?, content, language?, tags? }
router.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const language = req.body.language || resolveLanguage(req);

  const rawTitle = (req.body.title || "").toString().trim();
  const title = rawTitle || "Untitled entry";
  const content = req.body.content ?? "";
  const tags = normalizeTags(req.body.tags);
  const isArchived = Boolean(req.body.isArchived);

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        language,
        title,
        content,
        tags,
        isArchived
      }
    });

    res.status(201).json({ entry: publicEntry(entry) });
  } catch (error) {
    console.error("[Via Fidei] Journal create error", error);
    res.status(500).json({ error: "Failed to create journal entry" });
  }
});

// Update an existing entry, owner only
// PUT /api/journal/:id
router.put("/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const existing = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    const data = {};

    if (typeof req.body.title === "string") {
      const t = req.body.title.trim();
      if (t) data.title = t;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "content")) {
      data.content = req.body.content;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "language")) {
      const lang = String(req.body.language || "").toLowerCase();
      data.language = SUPPORTED_LANGS.includes(lang) ? lang : existing.language;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "tags")) {
      data.tags = normalizeTags(req.body.tags);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isArchived")) {
      data.isArchived = Boolean(req.body.isArchived);
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data
    });

    res.json({ entry: publicEntry(updated) });
  } catch (error) {
    console.error("[Via Fidei] Journal update error", error);
    res.status(500).json({ error: "Failed to update journal entry" });
  }
});

// Archive or unarchive an entry
// POST /api/journal/:id/archive { isArchived: true|false }
router.post("/:id/archive", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const existing = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    const isArchived = Boolean(req.body.isArchived);

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: { isArchived }
    });

    res.json({ entry: publicEntry(updated) });
  } catch (error) {
    console.error("[Via Fidei] Journal archive toggle error", error);
    res.status(500).json({ error: "Failed to update archive state" });
  }
});

// Delete an entry permanently
// DELETE /api/journal/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const existing = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    await prisma.journalEntry.delete({
      where: { id }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Journal delete error", error);
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

module.exports = router;
