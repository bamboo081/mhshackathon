// File: routes/join-org.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const { userEmail, registrationKey } = req.body;
  if (!userEmail || !registrationKey) return res.status(400).json({ error: "Missing fields" });

  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const org = await prisma.organization.findUnique({ where: { registrationKey } });
    if (!org) return res.status(404).json({ error: "Organization not found" });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
      },
    });

    await prisma.orgMember.create({
      data: {
        userId: user.id,
        orgId: org.id,
        role: "member",
      },
    });

    res.json({ status: "joined", orgName: org.name });
  } catch (err) {
    console.error("join-org error:", err);
    res.status(500).json({ error: "Failed to join org" });
  }
});

export default router;
