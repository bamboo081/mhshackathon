// File: routes/register-org.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const { userEmail, orgName } = req.body;
  if (!userEmail || !orgName) return res.status(400).json({ error: "Missing fields" });

  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const registrationKey = randomUUID();
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        registrationKey,
        users: { connect: { id: user.id } },
      },
    });

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
        role: "admin",
      },
    });

    res.json({ status: "created", registrationKey });
  } catch (err) {
    console.error("register-org error:", err);
    res.status(500).json({ error: "Failed to create org" });
  }
});

export default router;
