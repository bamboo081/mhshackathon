// routes/orgInfo.js
import express from "express";
import prisma from "../prisma/client.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organization: true,
    },
  });

  if (!user || !user.organizationId) return res.status(404).json({ error: "Not part of any org" });

  const orgUsers = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, email: true, role: true },
  });

  res.json({ org: user.organization, users: orgUsers });
});

export default router;
