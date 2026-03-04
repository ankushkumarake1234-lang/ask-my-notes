import { Router } from "express";
import { authMiddleware } from "@/middleware/auth";
import {
  getChats,
  createChat,
  getMessages,
  askQuestion,
  deleteChat,
  generateMCQ,
} from "@/controllers/chat";

const router = Router();

router.use(authMiddleware);

router.get("/", getChats);
router.post("/", createChat);
router.get("/mcq/:subjectId", generateMCQ);   // Generate real MCQs from subject PDFs
router.get("/:chatId/messages", getMessages);
router.post("/:chatId/ask", askQuestion);
router.delete("/:chatId", deleteChat);

export default router;
