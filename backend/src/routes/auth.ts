import { Router } from "express";
import { registerOrGetUser, validateToken } from "@/controllers/auth";

const router = Router();

router.post("/register", registerOrGetUser);
router.post("/validate", validateToken);

export default router;
