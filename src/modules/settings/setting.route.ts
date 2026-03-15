import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { settingController } from "./setting.controller";
import { upsertSettingSchema } from "./setting.validation";

const settingRouter = Router();

settingRouter.get("/", settingController.getSettings);
settingRouter.put(
  "/",
  authMiddleware,
  roleMiddleware(...ADMIN_ROLES),
  validateRequest(upsertSettingSchema),
  settingController.upsertSettings,
);

export default settingRouter;
