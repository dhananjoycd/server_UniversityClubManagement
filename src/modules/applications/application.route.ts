import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { applicationController } from "./application.controller";
import {
  applicationListQuerySchema,
  createApplicationSchema,
  reviewApplicationSchema,
} from "./application.validation";

const applicationRouter = Router();

applicationRouter.use(authMiddleware);
applicationRouter.post("/", validateRequest(createApplicationSchema), applicationController.createApplication);
applicationRouter.get("/", validateRequest(applicationListQuerySchema, "query"), applicationController.getApplications);
applicationRouter.get("/:id", applicationController.getApplicationById);
applicationRouter.patch(
  "/:id/review",
  roleMiddleware(...ADMIN_ROLES),
  validateRequest(reviewApplicationSchema),
  applicationController.reviewApplication,
);

export default applicationRouter;
