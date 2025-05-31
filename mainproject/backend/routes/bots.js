// File: routes/bots.js
import express from "express";
import prisma from "../prisma/client.js";

const router = express.Router();

// GET all bots with average rating & hire count
router.get("/", async (req, res) => {
  try {
    const bots = await prisma.bot.findMany({
      include: {
        _count: {
          select: { hires: true, ratings: true },
        },
      },
    });
    res.json(bots);
  } catch (err) {
    console.error("Failed to fetch bots:", err);
    res.status(500).json({ error: "Failed to load bots" });
  }
});

// POST /api/hire { userId, botId }
router.post("/hire", async (req, res) => {
  const { userId, botId } = req.body;
  try {
    const hire = await prisma.botHire.create({
      data: {
        userId,
        botId,
      },
    });
    res.json({ status: "hired", hire });
  } catch (err) {
    console.error("Failed to hire bot:", err);
    res.status(500).json({ error: "Hiring failed" });
  }
});

// POST /api/rate-bot { userId, botId, score }
router.post("/rate", async (req, res) => {
  const { userId, botId, score } = req.body;
  try {
    await prisma.botRating.create({
      data: {
        userId,
        botId,
        score: parseInt(score),
      },
    });

    // Recalculate average
    const ratings = await prisma.botRating.findMany({ where: { botId } });
    const avg =
      ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length;

    await prisma.bot.update({
      where: { id: botId },
      data: { averageRating: avg },
    });

    res.json({ status: "rated", average: avg });
  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ error: "Rating failed" });
  }
});

export default router;
