import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { errorHandler } from "@/middleware/auth";

// Routes
import authRoutes from "@/routes/auth";
import subjectRoutes from "@/routes/subject";
import pdfRoutes from "@/routes/pdf";
import chatRoutes from "@/routes/chat";

dotenv.config();

// compute __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate essential environment variables
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not set. Please configure your .env file.");
}
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not set. Authentication will fail without it.");
}
if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn("⚠️ No AI API key found. Question answering will return an error until you set OPENAI_API_KEY or GEMINI_API_KEY.");
}

// ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
const isDev = process.env.NODE_ENV !== "production";
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // In development, allow any localhost port
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // In production, only allow the configured frontend URL
    if (origin === FRONTEND_URL || origin === "https://ask-my-notes-dashboard.netlify.app") return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Bypass-Tunnel-Reminder", "bypass-tunnel-reminder"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "AskMyNotes backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/chats", chatRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ AskMyNotes backend running on port ${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   - Auth: POST /api/auth/register, POST /api/auth/validate`);
  console.log(`   - Subjects: GET/POST /api/subjects, PUT/DELETE /api/subjects/:id`);
  console.log(`   - PDFs: POST /api/pdfs/upload, GET /api/pdfs, DELETE /api/pdfs/:id`);
  console.log(`   - Chat: GET/POST /api/chats, GET /api/chats/:chatId/messages, POST /api/chats/:chatId/ask`);
});
