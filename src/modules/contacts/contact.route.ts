import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { contactController } from "./contact.controller";
import { contactMessageListQuerySchema, createContactMessageSchema, reviewContactMessageSchema } from "./contact.validation";

const contactRouter = Router();

contactRouter.get("/admin", authMiddleware, roleMiddleware(...ADMIN_ROLES), validateRequest(contactMessageListQuerySchema, "query"), contactController.getAdminContactMessages);
contactRouter.get("/mine", authMiddleware, contactController.getMyContactMessages);
contactRouter.post("/", authMiddleware, validateRequest(createContactMessageSchema), contactController.createContactMessage);
contactRouter.patch("/:id/review", authMiddleware, roleMiddleware(...ADMIN_ROLES), validateRequest(reviewContactMessageSchema), contactController.reviewContactMessage);

export default contactRouter;
