import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "@/middleware/auth";
import { uploadPDF, getPDFs, deletePDF } from "@/controllers/pdf";
import path from "path";

const router = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = new URL("../../uploads", import.meta.url).pathname;
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

router.use(authMiddleware);

router.post("/upload", upload.single("file"), uploadPDF);
router.get("/", getPDFs);
router.delete("/:id", deletePDF);

export default router;
