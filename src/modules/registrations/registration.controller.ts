import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { registrationService } from "./registration.service";

const getParamId = (id: string | string[] | undefined) => Array.isArray(id) ? id[0] : id ?? "";

const getRegistrations: RequestHandler = catchAsync(async (req, res) => {
  const registrations = await registrationService.getRegistrations(
    res.locals.auth.user.id,
    res.locals.auth.user.role,
    req.query as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Registrations fetched successfully",
    data: registrations,
  });
});

const cancelRegistration: RequestHandler = catchAsync(async (req, res) => {
  const registration = await registrationService.cancelRegistration(
    getParamId(req.params.id),
    res.locals.auth.user.id,
    res.locals.auth.user.role,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Registration cancelled successfully",
    data: registration,
  });
});

export const registrationController = {
  getRegistrations,
  cancelRegistration,
};

