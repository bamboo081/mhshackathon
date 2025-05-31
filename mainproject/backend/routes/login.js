// File: backend/routes/login.js
import express from "express";
import prisma from "../prisma/client.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { type, email, address } = req.body;

  try {
    let user;
    if (type === "email") {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (type === "wallet") {
      user = await prisma.user.findUnique({ where: { wallet: address } });
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      userId: user.id,
      accountType: user.accountType,
    });
  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
