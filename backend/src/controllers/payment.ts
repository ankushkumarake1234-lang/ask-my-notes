import { Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, userEmail } = req;
    const { priceId } = req.body;

    if (!userId || !userEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    // Get or create stripe customer
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?status=cancel`,
      metadata: {
        userId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: any, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret || "");
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
            subscriptionPlan: "pro", // Simplified for now
          },
        });

        // Record payment
        await prisma.payment.create({
          data: {
            userId,
            stripePaymentId: session.payment_intent as string || "subscription", // stripe uses PaymentIntent or Subscription
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "succeeded",
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: subscription.status,
          },
        });
      } else {
        // Try finding user by stripeCustomerId
        const customerId = subscription.customer as string;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: subscription.status,
          },
        });
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
