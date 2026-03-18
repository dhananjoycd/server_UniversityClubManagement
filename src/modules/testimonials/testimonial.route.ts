import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { testimonialController } from "./testimonial.controller";
import { createTestimonialSchema, reviewTestimonialSchema, testimonialListQuerySchema } from "./testimonial.validation";

const testimonialRouter = Router();

testimonialRouter.get("/", testimonialController.getPublicTestimonials);
testimonialRouter.get("/admin", authMiddleware, roleMiddleware(...ADMIN_ROLES), validateRequest(testimonialListQuerySchema, "query"), testimonialController.getAdminTestimonials);
testimonialRouter.get("/mine", authMiddleware, testimonialController.getMyTestimonials);
testimonialRouter.post("/", authMiddleware, validateRequest(createTestimonialSchema), testimonialController.createTestimonial);
testimonialRouter.patch("/:id/review", authMiddleware, roleMiddleware(...ADMIN_ROLES), validateRequest(reviewTestimonialSchema), testimonialController.reviewTestimonial);

export default testimonialRouter;
