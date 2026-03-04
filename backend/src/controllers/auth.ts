import { Request, Response } from "express";
import prisma from "@/lib/prisma";
import { generateToken } from "@/utils/jwt";

export const registerOrGetUser = async (req: Request, res: Response) => {
  try {
    const { firebaseId, email, displayName, photoUrl } = req.body;

    if (!firebaseId || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { firebaseId },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseId,
          email,
          displayName: displayName || email.split("@")[0],
          photoUrl,
        },
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
      token,
    });
  } catch (err: any) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.body.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
