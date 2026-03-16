import express, { Router } from "express";

import { paymentController } from "./payment.controller";

const paymentRouter = Router();

paymentRouter.post("/stripe/webhook", express.raw({ type: "application/json" }), paymentController.handleStripeWebhook);

export default paymentRouter;
