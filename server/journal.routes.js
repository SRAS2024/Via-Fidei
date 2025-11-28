// server/journal.routes.js
// Spiritual journal for Via Fidei
// All entries are private per user and stored safely in PostgreSQL.

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

function publicEntry(e) {
  return {
    id: e.id,
    userId: e.userId,
    title: e.title,
    body: e.body,
    isFavorite: Boolean(e.isFavorite),
    isArchived: Boolean(e.isArchived),
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
  };
}

// List journal entries for current user
// GET /api/journal?favorite=false|true|all&view=active|archived|all&take=20&cursor=<id>
router.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  const favoriteParam = (req.query.favorite || "all").toString();
  const viewParam = (req.query.view || "active").toString();

  const take = Math.min(Number(req.query.take) || 20, 100);
  const cursor = req.query.cursor || null;

  let favoriteFilter = {};
  if (favoriteParam === "true") {
    favoriteFilter = { isFavorite: true };
  } else if (favoriteParam === "false") {
    favoriteFilter = { isFavorite: false };
  }

  let archivedFilter = {};
  if (viewParam === "active") {
    archivedFilter = { isArchived: false };
  } else if (viewParam === "archived") {
    archivedFilter = { isArchived: true };
  }
  // "all" leaves archivedFilter empty

  try {
    const where = {
      userId,
      ...favoriteFilter,
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
// { title?, body?, content?, isFavorite? }
router.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  const rawTitle = (req.body.title || "").toString().trim();
  const title = rawTitle || "Untitled entry";

  // Support either body or legacy content key in the request
  const contentBody =
    typeof req.body.body === "string"
      ? req.body.body
      : typeof req.body.content === "string"
      ? req.body.content
      : "";

  if (!contentBody.trim()) {
    return res.status(400).json({ error: "Journal body is required" });
  }

  const isFavorite = Boolean(req.body.isFavorite);

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        title,
        body: contentBody,
        isFavorite,
        isArchived: false
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
      if (t) {
        data.title = t;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "body")) {
      if (typeof req.body.body === "string") {
        data.body = req.body.body;
      }
    } else if (Object.prototype.hasOwnProperty.call(req.body, "content")) {
      if (typeof req.body.content === "string") {
        data.body = req.body.content;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isFavorite")) {
      data.isFavorite = Boolean(req.body.isFavorite);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isArchived")) {
      data.isArchived = Boolean(req.body.isArchived);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
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

// Toggle favorite on an entry
// POST /api/journal/:id/favorite { isFavorite: true|false }
router.post("/:id/favorite", requireAuth, async (req, res) => {
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

    const isFavorite = Boolean(req.body.isFavorite);

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: { isFavorite }
    });

    res.json({ entry: publicEntry(updated) });
  } catch (error) {
    console.error("[Via Fidei] Journal favorite toggle error", error);
    res.status(500).json({ error: "Failed to update favorite state" });
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
