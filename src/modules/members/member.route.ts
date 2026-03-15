import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { memberController } from "./member.controller";
import { memberListQuerySchema, updateMemberSchema } from "./member.validation";

const memberRouter = Router();

memberRouter.use(authMiddleware);
memberRouter.get(
  "/",
  roleMiddleware(...ADMIN_ROLES),
  validateRequest(memberListQuerySchema, "query"),
  memberController.getMembers,
);
memberRouter.get("/:id", memberController.getMemberById);
memberRouter.patch("/:id", validateRequest(updateMemberSchema), memberController.updateMember);

export default memberRouter;
