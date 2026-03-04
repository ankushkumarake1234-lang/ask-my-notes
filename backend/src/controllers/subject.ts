import { Request, Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import prisma from "@/lib/prisma";

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: req.userId },
      include: {
        pdfs: {
          select: { id: true, originalFileName: true, pageCount: true },
        },
        _count: {
          select: { chats: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, subjects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Check if subject already exists for this user
    const existing = await prisma.subject.findUnique({
      where: {
        userId_name: {
          userId: req.userId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Subject already exists" });
    }

    const subject = await prisma.subject.create({
      data: {
        userId: req.userId,
        name: name.trim(),
        description: description || null,
      },
    });

    res.json({ success: true, subject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const subject = await prisma.subject.findFirst({
      where: { id, userId: req.userId },
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    await prisma.subject.delete({
      where: { id },
    });

    res.json({ success: true, message: "Subject deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Verify ownership
    const subject = await prisma.subject.findFirst({
      where: { id, userId: req.userId },
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: name || subject.name,
        description: description || subject.description,
      },
    });

    res.json({ success: true, subject: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
