import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { committeeController } from "./committee.controller";
import {
  createCommitteeAssignmentSchema,
  createCommitteeSessionSchema,
  updateCommitteeAssignmentSchema,
  updateCommitteeSessionSchema,
} from "./committee.validation";

const committeeRouter = Router();

committeeRouter.get("/public", committeeController.getPublicCommittee);
committeeRouter.get("/admin/sessions", authMiddleware, roleMiddleware("SUPER_ADMIN"), committeeController.getAdminCommitteeSessions);
committeeRouter.get("/admin/eligible-members", authMiddleware, roleMiddleware("SUPER_ADMIN"), committeeController.getEligibleMembers);
committeeRouter.post("/sessions", authMiddleware, roleMiddleware("SUPER_ADMIN"), validateRequest(createCommitteeSessionSchema), committeeController.createCommitteeSession);
committeeRouter.patch("/sessions/:id", authMiddleware, roleMiddleware("SUPER_ADMIN"), validateRequest(updateCommitteeSessionSchema), committeeController.updateCommitteeSession);
committeeRouter.delete("/sessions/:id", authMiddleware, roleMiddleware("SUPER_ADMIN"), committeeController.deleteCommitteeSession);
committeeRouter.post("/assignments", authMiddleware, roleMiddleware("SUPER_ADMIN"), validateRequest(createCommitteeAssignmentSchema), committeeController.createCommitteeAssignment);
committeeRouter.patch("/assignments/:id", authMiddleware, roleMiddleware("SUPER_ADMIN"), validateRequest(updateCommitteeAssignmentSchema), committeeController.updateCommitteeAssignment);
committeeRouter.delete("/assignments/:id", authMiddleware, roleMiddleware("SUPER_ADMIN"), committeeController.deleteCommitteeAssignment);

export default committeeRouter;
