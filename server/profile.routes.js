// server/profile.routes.js
// Profile, My Prayers, Journal, Goals, Milestones, and settings

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

function normalizeTheme(value) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  if (v === "light" || v === "dark" || v === "system") return v;
  return null;
}

function normalizeLanguage(value) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  if (SUPPORTED_LANGS.includes(v)) return v;
  return null;
}

// Small helper for status update on overdue goals
async function refreshGoalStatuses(prisma, userId) {
  const now = new Date();
  await prisma.goal.updateMany({
    where: {
      userId,
      status: "ACTIVE",
      dueDate: { lt: now },
      completedAt: null
    },
    data: { status: "OVERDUE" }
  });
}

// Shape user for client
function publicUser(u) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    themePreference: u.themePreference,
    languageOverride: u.languageOverride,
    profilePictureUrl: u.profilePictureUrl,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };
}

// Overview of profile
router.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;

  try {
    const [savedPrayersCount, journalCount, goalsCount, milestonesCount] =
      await Promise.all([
        prisma.savedPrayer.count({ where: { userId: user.id } }),
        prisma.journalEntry.count({ where: { userId: user.id } }),
        prisma.goal.count({ where: { userId: user.id } }),
        prisma.milestone.count({ where: { userId: user.id } })
      ]);

    res.json({
      user: publicUser(user),
      overview: {
        savedPrayersCount,
        journalCount,
        goalsCount,
        milestonesCount
      }
    });
  } catch (error) {
    console.error("[Via Fidei] Profile overview error", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// Settings: theme, language, privacy overview later
router.put("/settings", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { themePreference, languageOverride } = req.body || {};

  const nextTheme = normalizeTheme(themePreference);
  const nextLang = normalizeLanguage(languageOverride);

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        themePreference: nextTheme,
        languageOverride: nextLang
      }
    });

    res.json({ user: publicUser(updated) });
  } catch (error) {
    console.error("[Via Fidei] Update settings error", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Profile picture editing (URL based, file upload can be added later)
router.put("/avatar", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { profilePictureUrl } = req.body || {};

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePictureUrl: profilePictureUrl || null }
    });

    res.json({ user: publicUser(updated) });
  } catch (error) {
    console.error("[Via Fidei] Update avatar error", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});

// My Prayers

router.get("/my-prayers", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;

  try {
    const saved = await prisma.savedPrayer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { prayer: true }
    });

    const items = saved
      .filter((s) => s.prayer && s.prayer.isActive)
      .map((s) => ({
        id: s.id,
        prayerId: s.prayerId,
        savedAt: s.createdAt,
        prayer: {
          id: s.prayer.id,
          language: s.prayer.language,
          slug: s.prayer.slug,
          title: s.prayer.title,
          content: s.prayer.content,
          category: s.prayer.category,
          tags: s.prayer.tags
        }
      }));

    res.json({ items });
  } catch (error) {
    console.error("[Via Fidei] My prayers load error", error);
    res.status(500).json({ error: "Failed to load saved prayers" });
  }
});

router.delete("/my-prayers/:prayerId", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { prayerId } = req.params;

  try {
    await prisma.savedPrayer.deleteMany({
      where: { userId: user.id, prayerId }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] My prayers delete error", error);
    res.status(500).json({ error: "Failed to remove saved prayer" });
  }
});

// Journal

router.get("/journal", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;

  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    res.json({ items: entries });
  } catch (error) {
    console.error("[Via Fidei] Journal list error", error);
    res.status(500).json({ error: "Failed to load journal entries" });
  }
});

router.post("/journal", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { title, body, isFavorite } = req.body || {};

  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: "Journal body is required" });
  }

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        title: String(title || "Untitled").trim(),
        body: String(body),
        isFavorite: Boolean(isFavorite)
      }
    });

    res.status(201).json({ entry });
  } catch (error) {
    console.error("[Via Fidei] Journal create error", error);
    res.status(500).json({ error: "Failed to create journal entry" });
  }
});

router.put("/journal/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { id } = req.params;
  const { title, body, isFavorite } = req.body || {};

  try {
    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        body: body !== undefined ? String(body) : existing.body,
        isFavorite:
          typeof isFavorite === "boolean" ? isFavorite : existing.isFavorite
      }
    });

    res.json({ entry: updated });
  } catch (error) {
    console.error("[Via Fidei] Journal update error", error);
    res.status(500).json({ error: "Failed to update journal entry" });
  }
});

router.delete("/journal/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { id } = req.params;

  try {
    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    await prisma.journalEntry.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Journal delete error", error);
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

// Goals

router.get("/goals", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;

  try {
    await refreshGoalStatuses(prisma, user.id);

    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
    });

    res.json({ items: goals });
  } catch (error) {
    console.error("[Via Fidei] Goals list error", error);
    res.status(500).json({ error: "Failed to load goals" });
  }
});

router.post("/goals", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { title, description, goalType, dueDate, checklist } = req.body || {};

  if (!title || !goalType) {
    return res.status(400).json({ error: "Title and goalType are required" });
  }

  let parsedDue = null;
  if (dueDate) {
    const d = new Date(dueDate);
    if (!Number.isNaN(d.getTime())) {
      parsedDue = d;
    }
  }

  let status = "ACTIVE";
  if (parsedDue && parsedDue < new Date()) {
    status = "OVERDUE";
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: String(title).trim(),
        description: String(description || "").trim(),
        goalType,
        status,
        dueDate: parsedDue,
        checklist: checklist || null
      }
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error("[Via Fidei] Goal create error", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.put("/goals/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { id } = req.params;
  const { title, description, status, dueDate, checklist } = req.body || {};

  try {
    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    let parsedDue = existing.dueDate;
    if (dueDate !== undefined) {
      if (!dueDate) {
        parsedDue = null;
      } else {
        const d = new Date(dueDate);
        if (!Number.isNaN(d.getTime())) {
          parsedDue = d;
        }
      }
    }

    let nextStatus = existing.status;
    if (status && ["ACTIVE", "COMPLETED", "OVERDUE"].includes(status)) {
      nextStatus = status;
    }

    let completedAt = existing.completedAt;
    if (nextStatus === "COMPLETED" && !completedAt) {
      completedAt = new Date();
    }
    if (nextStatus !== "COMPLETED") {
      completedAt = null;
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title:
          title !== undefined ? String(title).trim() : existing.title,
        description:
          description !== undefined
            ? String(description).trim()
            : existing.description,
        status: nextStatus,
        dueDate: parsedDue,
        checklist: checklist !== undefined ? checklist : existing.checklist,
        completedAt
      }
    });

    // Promote to Personal Milestone when completed
    if (updated.status === "COMPLETED") {
      const existingMilestone = await prisma.milestone.findFirst({
        where: { userId: user.id, goalId: updated.id }
      });

      if (!existingMilestone) {
        await prisma.milestone.create({
          data: {
            userId: user.id,
            title: updated.title,
            description: updated.description || null,
            milestoneType: "PERSONAL",
            goalId: updated.id,
            completedAt: updated.completedAt || new Date()
          }
        });
      }
    }

    res.json({ goal: updated });
  } catch (error) {
    console.error("[Via Fidei] Goal update error", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/goals/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;
  const { id } = req.params;

  try {
    const existing = await prisma.goal.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.milestone.deleteMany({
      where: { userId: user.id, goalId: id }
    });

    await prisma.goal.delete({ where: { id } });

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Goal delete error", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Milestones

router.get("/milestones", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const user = req.user;

  try {
    const milestones = await prisma.milestone.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sacrament: true,
        goal: true
      }
    });

    res.json({ items: milestones });
  } catch (error) {
    console.error("[Via Fidei] Milestones list error", error);
    res.status(500).json({ error: "Failed to load milestones" });
  }
});

module.exports = router;
