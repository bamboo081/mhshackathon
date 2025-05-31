// routes/admin-dashboard.js
import express from "express";
import prisma from "../prisma/client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || user.accountType !== "BUSINESS") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const bots = await prisma.botHire.findMany({
      where: {
        user: {
          organizationId: user.organizationId,
        },
      },
      include: {
        bot: true,
        user: true,
      },
    });

    res.json({ users, bots });
  } catch (err) {
    console.error("❌ Admin dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
