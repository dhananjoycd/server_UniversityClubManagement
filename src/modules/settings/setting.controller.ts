import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { settingService } from "./setting.service";

const getSettings: RequestHandler = catchAsync(async (_req, res) => {
  const settings = await settingService.getSettings();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Settings fetched successfully",
    data: settings,
  });
});

const upsertSettings: RequestHandler = catchAsync(async (req, res) => {
  const settings = await settingService.upsertSettings(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Settings updated successfully",
    data: settings,
  });
});

export const settingController = {
  getSettings,
  upsertSettings,
};

