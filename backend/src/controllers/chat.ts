import { Request, Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import prisma from "@/lib/prisma";
import { generateEmbedding, calculateSimilarity } from "@/utils/pdf";
import { callLLM, generateMCQFromContext } from "@/utils/response";

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: "Subject ID is required" });
    }

    // Verify subject ownership
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId as string, userId: req.userId },
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const chats = await prisma.chat.findMany({
      where: { subjectId: subjectId as string },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, chats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { subjectId, title } = req.body;

    if (!subjectId) {
      return res.status(400).json({ error: "Subject ID is required" });
    }

    // Verify subject ownership
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: req.userId },
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const chat = await prisma.chat.create({
      data: {
        userId: req.userId,
        subjectId,
        title: title || "New Chat",
      },
    });

    res.json({ success: true, chat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { chatId } = req.params;

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    // Parse citations JSON string → array for each message
    const parsedMessages = messages.map((msg) => ({
      ...msg,
      citations: msg.citations ? (() => { try { return JSON.parse(msg.citations!); } catch { return []; } })() : [],
    }));

    res.json({ success: true, messages: parsedMessages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const askQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { question } = req.body;
    const chatId = req.params.chatId || req.body.chatId;

    if (!chatId || !question) {
      return res.status(400).json({ error: "Missing chatId or question" });
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: "user",
        content: question,
      },
    });

    try {
      // Get all PDFs for this subject
      const pdfs = await prisma.pDF.findMany({
        where: { subjectId: chat.subjectId },
      });

      if (pdfs.length === 0) {
        // No PDFs uploaded
        const aiMessage = await prisma.message.create({
          data: {
            chatId,
            role: "assistant",
            content: "No documents uploaded for this subject yet. Please upload a PDF first.",
          },
        });
        return res.json({ success: true, message: aiMessage });
      }

      // Generate embedding for question (real API if configured)
      const questionEmbedding = await generateEmbedding(question);

      // Search for relevant chunks across all PDFs
      const chunks = await prisma.pDFChunk.findMany({
        where: {
          pdf: {
            subjectId: chat.subjectId,
          },
        },
        include: {
          pdf: {
            select: { id: true, originalFileName: true },
          },
        },
        take: 100,
      });

      // Calculate similarity and get top 5 relevant chunks
      const scoredChunks = chunks
        .map((chunk) => {
          const emb: number[] = Array.isArray(chunk.embedding) ? (chunk.embedding as number[]) : [];
          return {
            ...chunk,
            similarity: calculateSimilarity(questionEmbedding, emb),
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      // Build context from relevant chunks
      const context = scoredChunks
        .map((chunk) => `[From ${chunk.pdf.originalFileName}]\n${chunk.text}`)
        .join("\n\n---\n\n");

      if (!context || scoredChunks.length === 0) {
        const aiMessage = await prisma.message.create({
          data: {
            chatId,
            role: "assistant",
            content:
              "I couldn't find relevant information in your uploaded documents to answer this question.",
          },
        });
        return res.json({ success: true, message: aiMessage });
      }

      // Call LLM for answer
      const answer = await callLLM(question, context);

      // Create citations
      const citations = scoredChunks.map(
        (chunk) => `${chunk.pdf.originalFileName} — Page ${chunk.pageNumber || "?"}`
      );

      // Save AI message with citations
      const aiMessage = await prisma.message.create({
        data: {
          chatId,
          role: "assistant",
          content: answer,
          citations: JSON.stringify(citations),
          pdfIds: scoredChunks.map((c) => c.pdf.id).join(","),
        },
      });

      // Parse citations before sending — stored as JSON string, frontend needs array
      const parsedMessage = {
        ...aiMessage,
        citations: citations, // already an array, pass directly
      };

      res.json({ success: true, message: parsedMessage });
    } catch (err: any) {
      console.error("Question processing error:", err);

      const errorMessage = await prisma.message.create({
        data: {
          chatId,
          role: "assistant",
          content:
            "An error occurred while processing your question. Please try again.",
        },
      });

      res.status(500).json({ error: err.message, message: errorMessage });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { chatId } = req.params;

    // Verify ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json({ success: true, message: "Chat deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const generateMCQ = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { subjectId } = req.params;
    const count = Number(req.query.count) || 5;

    // Verify subject ownership
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: req.userId },
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Get all PDF chunks for this subject
    const chunks = await prisma.pDFChunk.findMany({
      where: {
        pdf: { subjectId },
      },
      select: { text: true },
      take: 20, // Use first 20 chunks for context
    });

    if (chunks.length === 0) {
      return res.status(400).json({
        error: "No PDF content found. Please upload a PDF to this subject first.",
      });
    }

    // Build context from chunks
    const context = chunks.map((c) => c.text).join("\n\n");

    // Generate MCQs
    const questions = await generateMCQFromContext(context, count);

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        error: "Failed to generate questions. The AI returned an empty response.",
      });
    }

    res.json({ success: true, questions, subjectName: subject.name });
  } catch (err: any) {
    console.error("MCQ generation error:", err);
    res.status(500).json({ error: err.message });
  }
};

