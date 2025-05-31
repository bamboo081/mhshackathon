import express from "express";
import prisma from "../prisma/client.js";

const router = express.Router();

// GET all bots
router.get("/bots", async (req, res) => {
  const bots = await prisma.bot.findMany({
    include: {
      _count: {
        select: { ratings: true },
      },
    },
  });
  res.json(bots);
});

// POST rate bot
router.post("/rate", async (req, res) => {
  const { userId, botId, score } = req.body;
  if (!userId || !botId || !score) return res.status(400).json({ error: "Missing fields" });

  await prisma.botRating.create({
    data: { userId, botId, score },
  });

  const ratings = await prisma.botRating.findMany({ where: { botId } });
  const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

  await prisma.bot.update({
    where: { id: botId },
    data: { averageRating: avg },
  });

  res.json({ status: "rated", averageRating: avg });
});

// POST hire bot
router.post("/hire", async (req, res) => {
  const { userId, botId } = req.body;
  if (!userId || !botId) return res.status(400).json({ error: "Missing fields" });

  await prisma.botHire.create({ data: { userId, botId } });
  res.json({ status: "hired" });
});

export default router;
