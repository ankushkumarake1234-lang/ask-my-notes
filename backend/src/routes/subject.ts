import { Router } from "express";
import { authMiddleware } from "@/middleware/auth";
import {
  getSubjects,
  createSubject,
  deleteSubject,
  updateSubject,
} from "@/controllers/subject";

const router = Router();

router.use(authMiddleware);

router.get("/", getSubjects);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
