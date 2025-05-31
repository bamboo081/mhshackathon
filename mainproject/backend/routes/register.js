// backend/routes/register.js
import express from "express";
import prisma from "../prisma/client.js";
import admin from "../firebaseAdmin.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password, accountType = "PERSONAL" } = req.body;

  try {
    // 1. Create Firebase user thing
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    const newUser = await prisma.user.create({
      data: {
        email,
        accountType,
      },
    });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
``  }


    res.json({ status: "ok", user: newUser });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

export default router;
