import express, { Router } from "express";
import { createCheckoutSession, handleWebhook, getSubscriptionStatus } from "@/controllers/payment";
import { authMiddleware } from "@/middleware/auth";

const router = Router();

// Webhook route - needs raw body handled in index.ts
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Protected routes
router.post("/create-checkout-session", authMiddleware as any, createCheckoutSession as any);
router.get("/status", authMiddleware as any, getSubscriptionStatus as any);

export default router;
