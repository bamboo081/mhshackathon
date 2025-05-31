// routes/org-info.js
import express from "express";
import prisma from "../prisma/client.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return res.status(404).json({ error: "User or organization not found" });
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        email: true,
        wallet: true,
        role: true,
      },
    });

    res.json({ org, users });
  } catch (err) {
    console.error("org-info error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;


