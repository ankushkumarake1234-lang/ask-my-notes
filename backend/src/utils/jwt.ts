import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRE = "7d";

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const verifyToken = (token: string): { userId: string; email: string } | null => {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email };
  } catch (err) {
    return null;
  }
};
