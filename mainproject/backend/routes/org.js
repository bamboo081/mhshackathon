import express from "express";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const router = express.Router();
const prisma = new PrismaClient();

// Create a new organization and register user as admin
router.post("/register-org", async (req, res) => {
  const { name, user } = req.body;

  if (!name || !user?.email) {
    return res.status(400).json({ error: "Missing org name or user info" });
  }

  const registrationKey = nanoid(10);

  try {
    // Create org
    const org = await prisma.organization.create({
      data: {
        name,
        registrationKey,
        users: {
          create: {
            email: user.email,
            accountType: "BUSINESS",
            role: "admin"
          }
        }
      }
    });

    res.json({ orgId: org.id, registrationKey });
  } catch (err) {
    console.error("❌ Error creating org:", err);
    res.status(500).json({ error: "Could not create organization" });
  }
});

// Join an existing organization via registrationKey
router.post("/join-org", async (req, res) => {
  const { registrationKey, user } = req.body;

  if (!registrationKey || !user?.email) {
    return res.status(400).json({ error: "Missing key or user info" });
  }

  
app.post("/api/org-info", async (req, res) => {
  const { user } = req.body;
  if (!user || (!user.email && !user.wallet)) {
    return res.status(400).json({ error: "Invalid user." });
  }

  try {
    const prismaUser = await prisma.user.findFirst({
      where: user.email ? { email: user.email } : { wallet: user.wallet },
      include: { organization: true },
    });

    if (!prismaUser || !prismaUser.organizationId) {
      return res.json({ org: null, members: [] });
    }

    const org = await prisma.organization.findUnique({
      where: { id: prismaUser.organizationId },
    });

    const members = await prisma.user.findMany({
      where: { organizationId: org.id },
      select: {
        id: true,
        email: true,
        wallet: true,
        accountType: true,
      },
    });

    const roles = await prisma.orgMember.findMany({
      where: { orgId: org.id },
      select: { userId: true, role: true },
    });

    const roleMap = Object.fromEntries(roles.map((r) => [r.userId, r.role]));

    const memberList = members.map((m) => ({
      ...m,
      role: roleMap[m.id] || "member",
    }));

    res.json({ org, members: memberList });
  } catch (err) {
    console.error("❌ /api/org-info error:", err);
    res.status(500).json({ error: "Failed to fetch org info." });
  }
});

  try {
    const org = await prisma.organization.findUnique({
      where: { registrationKey },
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        accountType: "BUSINESS",
        organizationId: org.id,
        role: "member"
      }
    });

    res.json({ status: "joined", orgId: org.id, userId: newUser.id });
  } catch (err) {
    console.error("❌ Error joining org:", err);
    res.status(500).json({ error: "Could not join organization" });
  }
});

export default router;
