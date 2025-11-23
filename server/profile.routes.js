// server/profile.routes.js
// Profile, My Prayers, Journal, Goals, Milestones, and Settings

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

// Utility to mark overdue goals on the fly
async function refreshOverdueGoals(prisma, userId) {
  const now = new Date();
  await prisma.goal.updateMany({
    where: {
      userId,
      status: "ACTIVE",
      dueDate: { lt: now }
    },
    data: { status: "OVERDUE" }
  });
}

// Basic profile info
router.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  try {
    const [user, counts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          themePreference: true,
          languageOverride: true,
          profilePictureUrl: true,
          createdAt: true
        }
      }),
      prisma.$transaction([
        prisma.savedPrayer.count({ where: { userId } }),
        prisma.savedSaint.count({ where: { userId } }),
        prisma.savedApparition.count({ where: { userId } }),
        prisma.journalEntry.count({ where: { userId } }),
        prisma.goal.count({ where: { userId } }),
        prisma.milestone.count({ where: { userId } })
      ])
    ]);

    const [
      savedPrayersCount,
      savedSaintsCount,
      savedApparitionsCount,
      journalCount,
      goalsCount,
      milestonesCount
    ] = counts;

    res.json({
      user,
      summary: {
        savedPrayersCount,
        savedSaintsCount,
        savedApparitionsCount,
        journalCount,
        goalsCount,
        milestonesCount
      }
    });
  } catch (error) {
    console.error("[Via Fidei] Profile load error", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// Settings

router.get("/settings", requireAuth, async (req, res) => {
  res.json({
    themePreference: req.user.themePreference || "light",
    languageOverride: req.user.languageOverride || null,
    profilePictureUrl: req.user.profilePictureUrl || null
  });
});

router.put("/settings", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { themePreference, languageOverride, profilePictureUrl } = req.body || {};

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(themePreference ? { themePreference } : {}),
        ...(languageOverride ? { languageOverride } : {}),
        ...(profilePictureUrl != null ? { profilePictureUrl } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        themePreference: true,
        languageOverride: true,
        profilePictureUrl: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error("[Via Fidei] Settings update error", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// My Prayers

router.get("/prayers", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  try {
    const saved = await prisma.savedPrayer.findMany({
      where: { userId },
      include: {
        prayer: {
          select: {
            id: true,
            title: true,
            content: true,
            language: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      items: saved.map((row) => ({
        id: row.id,
        prayerId: row.prayer.id,
        title: row.prayer.title,
        content: row.prayer.content,
        language: row.prayer.language,
        category: row.prayer.category
      }))
    });
  } catch (error) {
    console.error("[Via Fidei] My Prayers load error", error);
    res.status(500).json({ error: "Failed to load saved prayers" });
  }
});

// Add to My Prayers
router.post("/prayers/:prayerId", requireAuth, async (req, res) => {
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
    console.error("[Via Fidei] Add My Prayer error", error);
    res.status(500).json({ error: "Failed to save prayer" });
  }
});

// Remove from My Prayers
router.delete("/prayers/:prayerId", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { prayerId } = req.params;

  try {
    await prisma.savedPrayer.delete({
      where: { userId_prayerId: { userId, prayerId } }
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Remove My Prayer error", error);
    res.status(500).json({ error: "Failed to remove prayer" });
  }
});

// Saved Saints and Our Lady

router.get("/saints", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  try {
    const [saints, apparitions] = await Promise.all([
      prisma.savedSaint.findMany({
        where: { userId },
        include: {
          saint: {
            select: {
              id: true,
              name: true,
              language: true,
              officialPrayer: true,
              imageUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.savedApparition.findMany({
        where: { userId },
        include: {
          apparition: {
            select: {
              id: true,
              title: true,
              language: true,
              officialPrayer: true,
              imageUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    res.json({
      saints: saints.map((row) => ({
        id: row.id,
        saintId: row.saint.id,
        name: row.saint.name,
        language: row.saint.language,
        imageUrl: row.saint.imageUrl,
        prayer: row.saint.officialPrayer
      })),
      apparitions: apparitions.map((row) => ({
        id: row.id,
        apparitionId: row.apparition.id,
        title: row.apparition.title,
        language: row.apparition.language,
        imageUrl: row.apparition.imageUrl,
        prayer: row.apparition.officialPrayer
      }))
    });
  } catch (error) {
    console.error("[Via Fidei] Saved saints load error", error);
    res.status(500).json({ error: "Failed to load saved saints and apparitions" });
  }
});

router.post("/saints/:saintId", requireAuth, async (req, res) => {
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
    console.error("[Via Fidei] Save saint error", error);
    res.status(500).json({ error: "Failed to save saint" });
  }
});

router.delete("/saints/:saintId", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { saintId } = req.params;

  try {
    await prisma.savedSaint.delete({
      where: { userId_saintId: { userId, saintId } }
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Remove saint error", error);
    res.status(500).json({ error: "Failed to remove saint" });
  }
});

router.post("/apparitions/:apparitionId", requireAuth, async (req, res) => {
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
    console.error("[Via Fidei] Save apparition error", error);
    res.status(500).json({ error: "Failed to save apparition" });
  }
});

router.delete("/apparitions/:apparitionId", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { apparitionId } = req.params;

  try {
    await prisma.savedApparition.delete({
      where: { userId_apparitionId: { userId, apparitionId } }
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Remove apparition error", error);
    res.status(500).json({ error: "Failed to remove apparition" });
  }
});

// Journal

router.get("/journal", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json({ entries });
  } catch (error) {
    console.error("[Via Fidei] Journal load error", error);
    res.status(500).json({ error: "Failed to load journal entries" });
  }
});

router.post("/journal", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { title, body, isFavorite } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        title,
        body,
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
  const userId = req.user.id;
  const { id } = req.params;
  const { title, body, isFavorite } = req.body || {};

  try {
    const entry = await prisma.journalEntry.updateMany({
      where: { id, userId },
      data: {
        ...(title != null ? { title } : {}),
        ...(body != null ? { body } : {}),
        ...(isFavorite != null ? { isFavorite: Boolean(isFavorite) } : {})
      }
    });

    if (entry.count === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    const updated = await prisma.journalEntry.findUnique({ where: { id } });
    res.json({ entry: updated });
  } catch (error) {
    console.error("[Via Fidei] Journal update error", error);
    res.status(500).json({ error: "Failed to update journal entry" });
  }
});

router.delete("/journal/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const deleted = await prisma.journalEntry.deleteMany({
      where: { id, userId }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Journal delete error", error);
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

// Goals

router.get("/goals", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  try {
    await refreshOverdueGoals(prisma, userId);

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json({ goals });
  } catch (error) {
    console.error("[Via Fidei] Goals load error", error);
    res.status(500).json({ error: "Failed to load goals" });
  }
});

router.post("/goals", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { title, description, goalType, dueDate, checklist } = req.body || {};

  if (!title || !description || !goalType) {
    return res.status(400).json({ error: "Title, description, and goalType are required" });
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        goalType,
        status: "ACTIVE",
        dueDate: dueDate ? new Date(dueDate) : null,
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
  const userId = req.user.id;
  const { id } = req.params;
  const { title, description, goalType, status, dueDate, checklist } = req.body || {};

  try {
    const updated = await prisma.goal.updateMany({
      where: { id, userId },
      data: {
        ...(title != null ? { title } : {}),
        ...(description != null ? { description } : {}),
        ...(goalType != null ? { goalType } : {}),
        ...(status != null ? { status } : {}),
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
        ...(checklist !== undefined ? { checklist } : {})
      }
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const goal = await prisma.goal.findUnique({ where: { id } });
    res.json({ goal });
  } catch (error) {
    console.error("[Via Fidei] Goal update error", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// Complete goal and promote to Personal Milestone
router.post("/goals/:id/complete", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const now = new Date();

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: now
      }
    });

    if (goal.userId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const milestone = await prisma.milestone.upsert({
      where: {
        userId_goalId: { userId, goalId: goal.id }
      },
      create: {
        userId,
        title: goal.title,
        description: goal.description,
        milestoneType: "PERSONAL",
        goalId: goal.id,
        completedAt: now
      },
      update: {
        completedAt: now
      }
    });

    res.json({ goal, milestone });
  } catch (error) {
    console.error("[Via Fidei] Complete goal error", error);
    res.status(500).json({ error: "Failed to complete goal" });
  }
});

router.delete("/goals/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const deleted = await prisma.goal.deleteMany({
      where: { id, userId }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Goal delete error", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Milestones

router.get("/milestones", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;

  try {
    const milestones = await prisma.milestone.findMany({
      where: { userId },
      include: {
        sacrament: true,
        goal: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ milestones });
  } catch (error) {
    console.error("[Via Fidei] Milestones load error", error);
    res.status(500).json({ error: "Failed to load milestones" });
  }
});

// Add sacrament milestone
router.post("/milestones/sacrament", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { sacramentId, title, description, completedAt } = req.body || {};

  if (!sacramentId) {
    return res.status(400).json({ error: "sacramentId is required" });
  }

  try {
    const milestone = await prisma.milestone.upsert({
      where: {
        userId_sacramentId: { userId, sacramentId }
      },
      create: {
        userId,
        sacramentId,
        title: title || "",
        description: description || null,
        milestoneType: "SACRAMENT",
        completedAt: completedAt ? new Date(completedAt) : null
      },
      update: {
        title: title || "",
        description: description || null,
        ...(completedAt ? { completedAt: new Date(completedAt) } : {})
      }
    });

    res.status(201).json({ milestone });
  } catch (error) {
    console.error("[Via Fidei] Sacrament milestone error", error);
    res.status(500).json({ error: "Failed to save sacrament milestone" });
  }
});

// Add spiritual milestone (consecrations or retreats)
router.post("/milestones/spiritual", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { spiritualKey, title, description, completedAt } = req.body || {};

  if (!spiritualKey) {
    return res.status(400).json({ error: "spiritualKey is required" });
  }

  try {
    const milestone = await prisma.milestone.upsert({
      where: {
        userId_spiritualKey: { userId, spiritualKey }
      },
      create: {
        userId,
        spiritualKey,
        title: title || "",
        description: description || null,
        milestoneType: "SPIRITUAL",
        completedAt: completedAt ? new Date(completedAt) : null
      },
      update: {
        title: title || "",
        description: description || null,
        ...(completedAt ? { completedAt: new Date(completedAt) } : {})
      }
    });

    res.status(201).json({ milestone });
  } catch (error) {
    console.error("[Via Fidei] Spiritual milestone error", error);
    res.status(500).json({ error: "Failed to save spiritual milestone" });
  }
});

module.exports = router;
