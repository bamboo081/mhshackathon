// File: mainproject/backend/index.js

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import ragRouter from "./routes/rag.js";
import chatRoute from "./routes/chat.js";
import registerRoute from "./routes/register.js";
import orgRoute from "./routes/org.js";
import registerOrgRoute from "./routes/register-org.js";
import joinOrgRoute from "./routes/join-org.js";
import marketplaceRouter from "./routes/marketplace.js";
import botsRoute from "./routes/bots.js";
import loginRoute from "./routes/login.js";
import adminDashboardRoute from "./routes/admin-dashboard.js";
import orgInfoRoute from "./routes/org-info.js";


dotenv.config();
const app = express();
const port = 3000;

// The fix for __dirname (ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI model
const chatModel = new ChatOpenAI({
  temperature: 0.7,
  modelName: "gpt-3.5-turbo",
});

// ──────────────── Prisma Client ────────────────
const prisma = new PrismaClient();

// ──────────────── Middleware ────────────────
app.use(cors());
app.use(express.json());
app.use("/api", orgInfoRoute);
app.use("/api/marketplace", marketplaceRouter);

// Bot training
import trainRoute from "./routes/train.js";
app.use("/api/train", trainRoute);
app.use("/api/register", registerRoute);
app.use("/api/register-org", registerOrgRoute);
app.use("/api/join-org", joinOrgRoute);
app.use("/api/bots", botsRoute);
app.use("/api/login", loginRoute);
app.use("/api/admin-dashboard", adminDashboardRoute);
app.use("/api/org-info", orgInfoRoute);

// ──────────────── Load Knowledge Base ────────────────
const knowledgePath = "../knowledgeBase.json";
if (!fs.existsSync(knowledgePath)) {
  console.error("❌ Cannot find knowledgeBase.json. Ensure it’s in mainproject/");
  process.exit(1);
}
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));

// ──────────────── Initialize Chat Model ────────────────
const model = new ChatOpenAI({ temperature: 0.5 });

// ──────────────── Initialize ethers.js for Rewards ────────────────
const RPC_URL     = process.env.RPC_URL_AMOY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BCT_ADDRESS = process.env.BCT_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !BCT_ADDRESS) {
  console.error("❌ Missing RPC_URL_AMOY, PRIVATE_KEY, or BCT_ADDRESS in .env");
  process.exit(1);
}

// Create provider & signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Load BusinessCrypto ABI (make sure the path is correct)
const artifactPath = path.resolve(
  __dirname,
  "../../crypto/artifacts/contracts/BusinessCrypto.sol/BusinessCrypto.json"
);
const BctArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
const BCT_ABI = BctArtifact.abi;

// Create contract instance
const bctContract = new ethers.Contract(BCT_ADDRESS, BCT_ABI, signer);

// ──────────────── Utility: findOrCreateUser ────────────────
async function findOrCreateUser(user) {
  if (user.type === "email") {
    return await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { email: user.email },
    });
  } else if (user.type === "wallet") {
    return await prisma.user.upsert({
      where: { wallet: user.address },
      update: {},
      create: { wallet: user.address },
    });
  }
  throw new Error("Invalid user type");
}

// Wallet Link Route
app.post("/api/link-wallet", async (req, res) => {
  const { email, wallet } = req.body;
  if (!email || !wallet || !wallet.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid wallet or email" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { wallet },
    });
    return res.json({ status: "linked", user: updatedUser });
  } catch (err) {
    console.error("❌ Wallet linking failed:", err);
    res.status(500).json({ error: "Could not link wallet" });
  }
});


// ──────────────── POST /api/chat ────────────────
// Same as Phase 4 (inserts user + bot messages to DB, returns AI answer)
app.post("/api/chat", async (req, res) => {
  const { user, message } = req.body;

  if (!message || !user) {
    return res.status(400).json({ error: "Missing user or message" });
  }

  try {
    // Add a basic system prompt to guide the assistant
    const systemPrompt = new SystemMessage(
      "You are a helpful and friendly AI assistant for small businesses. Respond concisely and professionally."
    );

    const userMessage = new HumanMessage(message);

    // Send to OpenAI via LangChain
    const response = await chatModel.call([systemPrompt, userMessage]);

    const answer = response.text;

    // Store both user and bot message in DB (optional)
    const prismaUser = await findOrCreateUser(user);

    await prisma.message.createMany({
      data: [
        {
          text: message,
          from: "user",
          userId: prismaUser.id,
        },
        {
          text: answer,
          from: "bot",
          userId: prismaUser.id,
        },
      ],
    });

    res.json({ answer });
  } catch (err) {
    console.error("❌ LangChain chat error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────── GET /api/history ────────────────
// Same as Phase 4 (fetches past messages)
app.get("/api/history", async (req, res) => {
  try {
    const { email, wallet } = req.query;
    if (!email && !wallet) {
      return res
        .status(400)
        .json({ error: "Provide either ?email or ?wallet" });
    }
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else {
      user = await prisma.user.findUnique({ where: { wallet } });
    }
    if (!user) return res.json({ history: [] });

    const msgs = await prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { from: true, text: true, createdAt: true },
    });
    return res.json({ history: msgs });
  } catch (err) {
    console.error("🔴 /api/history error:", err);
    return res.status(500).json({ error: "Could not fetch history." });
  }
});

// ──────────────── POST /api/feedback ────────────────
// Saves feedback to DB (Phase 4)
app.post("/api/feedback", async (req, res) => {
  try {
    const { user: userObj, message: botMessage, feedback } = req.body;
    if (!userObj || !botMessage || !["yes", "no"].includes(feedback)) {
      return res.status(400).json({ error: "Invalid feedback payload" });
    }
    const user = await findOrCreateUser(userObj);
    await prisma.feedback.create({
      data: { message: botMessage, feedback, userId: user.id },
    });
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("🔴 /api/feedback error:", err);
    return res.status(500).json({ error: "Could not log feedback." });
  }
});

// ──────────────── POST /api/report ────────────────
// Saves mistake reports to DB (Phase 4)
app.post("/api/report", async (req, res) => {
  try {
    const { user: userObj, messageId, messageText, history } = req.body;
    if (!userObj || typeof messageId !== "number" || !messageText) {
      return res.status(400).json({ error: "Invalid report payload" });
    }
    const user = await findOrCreateUser(userObj);
    const snippetString = JSON.stringify(history || []);
    await prisma.report.create({
      data: { messageText, conversationSnippet: snippetString, userId: user.id },
    });
    return res.json({ status: "reported" });
  } catch (err) {
    console.error("🔴 /api/report error:", err);
    return res.status(500).json({ error: "Could not log report." });
  }
});

// ──────────────── NEW: POST /api/reward ────────────────
// Body: { to: string, amount: stringOrNumber (in tokens, e.g. "10") }
// Example: { "to": "0xUserWalletAddress...", "amount": "10" }
app.post("/api/reward", async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) {
    return res.status(400).json({ error: "Missing `to` or `amount`" });
  }

  try {
    // Convert amount (string or number) to BigNumber with 18 decimals
    // If your BusinessCrypto uses 18 decimals, do this:
    const tokens = ethers.parseUnits(amount.toString(), 18);

    // Call transfer(to, tokens)
    const tx = await bctContract.transfer(to, tokens);
    await tx.wait(); // wait for confirmation

    console.log(`✅ Transferred ${amount} BCT to ${to}: txHash=${tx.hash}`);
    return res.json({ status: "success", txHash: tx.hash });
  } catch (err) {
    console.error("🔴 /api/reward error:", err);
    return res.status(500).json({ error: "Token transfer failed" });
  }
});

app.get('/api/contributions', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // limit to 50 recent contributions
    });

    const contributions = messages.map(msg => ({
      id: msg.id,
      text: msg.text,
      from: msg.from,
      userWallet: msg.user?.wallet || 'N/A',
      userEmail: msg.user?.email || 'N/A',
      timestamp: msg.createdAt,
    }));

    res.json(contributions);
  } catch (err) {
    console.error("❌ Failed to fetch contributions:", err);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});



// ──────────────── Start Server ────────────────
app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port}`);
});
