// routes/rag.js
import express from "express";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { HumanMessage } from "@langchain/core/messages";

const router = express.Router();

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const model = new ChatOpenAI({
  temperature: 0.2,
  modelName: "gpt-3.5-turbo",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

router.get("/rag", async (req, res) => {
  try {
    const loader = new PDFLoader("docs/goemotions_model_card.pdf");
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(rawDocs);
    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    const retriever = vectorStore.asRetriever();

    const userQuestion = req.query.q || "What is this document about?";
    const relevantDocs = await retriever.getRelevantDocuments(userQuestion);

    const contextText = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    const prompt = `Answer the question based only on the following document content:\n\n${contextText}\n\nQuestion: ${userQuestion}`;
    const response = await model.invoke([new HumanMessage(prompt)]);

    res.json({ answer: response.content });
  } catch (err) {
    console.error("RAG error:", err);
    res.status(500).json({ error: "RAG failed" });
  }
});

export default router;
