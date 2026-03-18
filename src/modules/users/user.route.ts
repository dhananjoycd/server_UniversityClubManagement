import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { userController } from "./user.controller";
import { updateUserRoleSchema, userListQuerySchema } from "./user.validation";

const userRouter = Router();

userRouter.use(authMiddleware);
userRouter.get("/", roleMiddleware(...ADMIN_ROLES), validateRequest(userListQuerySchema, "query"), userController.getUsers);
userRouter.get("/:id", roleMiddleware(...ADMIN_ROLES), userController.getUserById);
userRouter.patch("/:id/role", roleMiddleware(...ADMIN_ROLES), validateRequest(updateUserRoleSchema), userController.updateUserRole);

export default userRouter;
