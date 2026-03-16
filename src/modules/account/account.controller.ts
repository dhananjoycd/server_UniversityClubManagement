import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { accountService } from "./account.service";

const getAccountProfile: RequestHandler = catchAsync(async (_req, res) => {
  const profile = await accountService.getAccountProfile(res.locals.auth.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Account profile fetched successfully", data: profile });
});

const updateAccountProfile: RequestHandler = catchAsync(async (req, res) => {
  const profile = await accountService.updateAccountProfile(res.locals.auth.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Account profile updated successfully", data: profile });
});

export const accountController = { getAccountProfile, updateAccountProfile };
