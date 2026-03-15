import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { MANAGEMENT_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { eventController } from "./event.controller";
import { createEventSchema, eventListQuerySchema, updateEventSchema } from "./event.validation";

const eventRouter = Router();

eventRouter.get("/", validateRequest(eventListQuerySchema, "query"), eventController.getEvents);
eventRouter.get("/:id", eventController.getEventById);
eventRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(...MANAGEMENT_ROLES),
  validateRequest(createEventSchema),
  eventController.createEvent,
);
eventRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(...MANAGEMENT_ROLES),
  validateRequest(updateEventSchema),
  eventController.updateEvent,
);
eventRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(...MANAGEMENT_ROLES),
  eventController.deleteEvent,
);
eventRouter.post("/:id/register", authMiddleware, eventController.registerForEvent);

export default eventRouter;
