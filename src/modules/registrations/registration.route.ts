import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { MANAGEMENT_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { registrationController } from "./registration.controller";
import { registrationListQuerySchema } from "./registration.validation";

const registrationRouter = Router();

registrationRouter.use(authMiddleware);
registrationRouter.get(
  "/",
  validateRequest(registrationListQuerySchema, "query"),
  registrationController.getRegistrations,
);
registrationRouter.patch("/:id/verify-payment", roleMiddleware(...MANAGEMENT_ROLES), registrationController.verifyPendingPayment);
registrationRouter.patch("/:id/cancel", registrationController.cancelRegistration);

export default registrationRouter;
