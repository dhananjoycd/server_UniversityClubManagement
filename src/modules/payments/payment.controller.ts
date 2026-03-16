import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import { paymentService } from "./payment.service";

const handleStripeWebhook: RequestHandler = catchAsync(async (req, res) => {
  await paymentService.handleStripeWebhook(req.headers["stripe-signature"] as string | undefined, req.body as Buffer);
  res.status(200).json({ received: true });
});

export const paymentController = { handleStripeWebhook };
