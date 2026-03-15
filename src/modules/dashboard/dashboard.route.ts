import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import sendResponse from "../../utils/sendResponse";
import { dashboardController } from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get(
  "/admin",
  roleMiddleware(...ADMIN_ROLES),
  dashboardController.getAdminDashboard,
);
dashboardRouter.get("/member", dashboardController.getMemberDashboard);
dashboardRouter.get("/test/admin", roleMiddleware(...ADMIN_ROLES), (_req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin route access granted",
    data: res.locals.auth,
  });
});

export default dashboardRouter;
