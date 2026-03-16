import Stripe from "stripe";

import { env } from "../../config/env";
import { stripeClient } from "../../config/stripe";
import AppError from "../../utils/AppError";
import { eventService } from "../events/event.service";

const handleStripeWebhook = async (signature: string | undefined, payload: Buffer) => {
  if (!stripeClient || !env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(500, "Stripe webhook is not configured");
  }
  if (!signature) {
    throw new AppError(400, "Missing Stripe signature");
  }

  const event = stripeClient.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  if (event.type === "checkout.session.completed") {
    await eventService.completePaidRegistration(event.data.object as Stripe.Checkout.Session);
  }
  return { received: true };
};

export const paymentService = { handleStripeWebhook };
