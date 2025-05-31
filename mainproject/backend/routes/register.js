// backend/routes/register.js
import express from "express";
import prisma from "../prisma/client.js";
import admin from "../firebaseAdmin.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password, accountType = "PERSONAL" } = req.body;

  try {
    // 1. Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // 2. Add user to your database
    const newUser = await prisma.user.create({
      data: {
        email,
        accountType,
      },
    });

    res.json({ status: "ok", user: newUser });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

export default router;
