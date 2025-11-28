// server/goals.routes.js
// Personal goals for Catholic life and practice
// All routes are per user and require authentication.

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

// Shape goal for client
function publicGoal(g) {
  return {
    id: g.id,
    title: g.title,
    description: g.description || "",
    goalType: g.goalType || "CUSTOM",
    status: g.status || "ACTIVE",
    dueDate: g.dueDate,
    checklist: g.checklist || null,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt
  };
}

// Simple helper to parse an optional ISO date string
function parseOptionalDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// Allowed statuses for safety
const ALLOWED_STATUS = new Set(["ACTIVE", "COMPLETED", "ARCHIVED"]);

// GET /api/goals
// Optional query params:
//   status=ACTIVE|COMPLETED|ARCHIVED|ALL (default ACTIVE)
router.get("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const statusParam = (req.query.status || "ACTIVE").toString().toUpperCase();

  try {
    const where = {
      userId
    };

    if (statusParam !== "ALL") {
      if (!ALLOWED_STATUS.has(statusParam)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      where.status = statusParam;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });

    res.json({
      items: goals.map(publicGoal)
    });
  } catch (error) {
    console.error("[Via Fidei] Goals list error", error);
    res.status(500).json({ error: "Failed to load goals" });
  }
});

// POST /api/goals
// Body:
//   { title, description?, goalType?, dueDate?, checklist? }
router.post("/", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const {
    title,
    description = "",
    goalType = "CUSTOM",
    dueDate,
    checklist
  } = req.body || {};

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const parsedDue = parseOptionalDate(dueDate);

  let normalizedChecklist = null;
  if (checklist && typeof checklist === "object") {
    // Accept either { items: [...] } or any object payload
    normalizedChecklist = checklist;
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: String(title).trim(),
        description: String(description || "").trim(),
        goalType: String(goalType || "CUSTOM").toUpperCase(),
        status: "ACTIVE",
        dueDate: parsedDue,
        checklist: normalizedChecklist
      }
    });

    res.status(201).json({ goal: publicGoal(goal) });
  } catch (error) {
    console.error("[Via Fidei] Create goal error", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// GET /api/goals/:id
router.get("/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({ goal: publicGoal(goal) });
  } catch (error) {
    console.error("[Via Fidei] Load goal error", error);
    res.status(500).json({ error: "Failed to load goal" });
  }
});

// PATCH /api/goals/:id
// Body can include any of:
//   title, description, status, goalType, dueDate, checklist
router.patch("/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  const {
    title,
    description,
    status,
    goalType,
    dueDate,
    checklist
  } = req.body || {};

  const data = {};

  if (typeof title === "string" && title.trim()) {
    data.title = title.trim();
  }

  if (typeof description === "string") {
    data.description = description.trim();
  }

  if (typeof goalType === "string" && goalType.trim()) {
    data.goalType = goalType.toUpperCase();
  }

  if (typeof status === "string") {
    const up = status.toUpperCase();
    if (!ALLOWED_STATUS.has(up)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    data.status = up;
  }

  if (dueDate !== undefined) {
    const parsedDue = parseOptionalDate(dueDate);
    data.dueDate = parsedDue;
  }

  if (checklist !== undefined) {
    if (checklist && typeof checklist === "object") {
      data.checklist = checklist;
    } else if (checklist === null) {
      data.checklist = null;
    } else {
      return res
        .status(400)
        .json({ error: "Checklist must be an object or null" });
    }
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    const existing = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const updated = await prisma.goal.update({
      where: { id },
      data
    });

    res.json({ goal: publicGoal(updated) });
  } catch (error) {
    console.error("[Via Fidei] Update goal error", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// POST /api/goals/:id/checklist/toggle
// Body: { index, done }
// Safely flips a checklist item for this goal.
router.post("/:id/checklist/toggle", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;
  const { index, done } = req.body || {};

  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0) {
    return res.status(400).json({ error: "Invalid checklist index" });
  }

  try {
    const goal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const checklist =
      goal.checklist && typeof goal.checklist === "object"
        ? { ...goal.checklist }
        : null;

    if (!checklist || !Array.isArray(checklist.items)) {
      return res.status(400).json({ error: "Goal has no checklist items" });
    }

    if (idx >= checklist.items.length) {
      return res.status(400).json({ error: "Checklist index out of range" });
    }

    const items = checklist.items.map((item, i) => {
      if (i !== idx) return item;
      const nextDone = typeof done === "boolean" ? done : !item.done;
      return { ...item, done: nextDone };
    });

    const updatedChecklist = {
      ...checklist,
      items
    };

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        checklist: updatedChecklist
      }
    });

    res.json({ goal: publicGoal(updated) });
  } catch (error) {
    console.error("[Via Fidei] Toggle checklist item error", error);
    res.status(500).json({ error: "Failed to update checklist item" });
  }
});

// DELETE /api/goals/:id
// Hard delete, since status already allows soft archiving when desired.
router.delete("/:id", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const existing = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.goal.delete({
      where: { id }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("[Via Fidei] Delete goal error", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

module.exports = router;
