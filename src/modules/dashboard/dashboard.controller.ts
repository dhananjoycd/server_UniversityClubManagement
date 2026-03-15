import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { dashboardService } from "./dashboard.service";

const getAdminDashboard: RequestHandler = catchAsync(async (_req, res) => {
  const dashboard = await dashboardService.getAdminDashboard();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin dashboard fetched successfully",
    data: dashboard,
  });
});

const getMemberDashboard: RequestHandler = catchAsync(async (_req, res) => {
  const dashboard = await dashboardService.getMemberDashboard(res.locals.auth.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Member dashboard fetched successfully",
    data: dashboard,
  });
});

export const dashboardController = {
  getAdminDashboard,
  getMemberDashboard,
};
