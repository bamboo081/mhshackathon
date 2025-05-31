import express from "express";
import prisma from "../prisma/client.js";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { userEmail } = req.body;

    // Fetch last 10 messages from that user
    const messages = await prisma.message.findMany({
      where: {
        user: {
          email: userEmail,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const examples = messages
      .reverse()
      .map((m) => `${m.from === "user" ? "User" : "Bot"}: ${m.text}`)
      .join("\n");

    console.log("Training data:\n", examples);
    const fewShotPrompt = `The following is a conversation between a helpful bot and a user.\n\n${examples}\n\nContinue the conversation:\nUser:`;

    res.json({ prompt: fewShotPrompt });
  } catch (err) {
    console.error("Training prompt error:", err);
    res.status(500).json({ error: "Training failed" });
  }
});

export default router;
