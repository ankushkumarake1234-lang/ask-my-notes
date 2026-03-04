import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation error", details: err.message });
  }

  if (err.status === 401) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};
