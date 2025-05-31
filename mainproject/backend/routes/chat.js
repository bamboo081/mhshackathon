// routes/chat.js
import express from "express";
import prisma from "../prisma/client.js";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { user, message } = req.body;
  if (!user || !message) {
    return res.status(400).json({ error: "Missing user or message" });
  }

  try {
    // Get last few messages to build few-shot prompt
    const history = await prisma.message.findMany({
      where: {
        user: {
          email: user.email || undefined,
          wallet: user.address || undefined,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const fewShotPrompt = history
      .reverse()
      .map((m) => `${m.from === "user" ? "User" : "Bot"}: ${m.text}`)
      .join("\n") + `\nUser: ${message}\nBot:`;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful AI assistant for small businesses." },
        { role: "user", content: fewShotPrompt }
      ],
    });

    const answer = chatCompletion.choices[0].message.content;

    // Save messages
    const dbUser = await prisma.user.upsert({
      where: {
        email: user.email || undefined,
        wallet: user.address || undefined,
      },
      update: {},
      create: {
        email: user.email || null,
        wallet: user.address || null,
      },
    });

    await prisma.message.createMany({
      data: [
        { from: "user", text: message, userId: dbUser.id },
        { from: "bot", text: answer, userId: dbUser.id },
      ],
    });

    res.json({ answer });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
