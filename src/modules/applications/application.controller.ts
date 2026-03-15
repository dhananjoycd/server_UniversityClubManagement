import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { applicationService } from "./application.service";

const getParamId = (id: string | string[] | undefined) => Array.isArray(id) ? id[0] : id ?? "";

const createApplication: RequestHandler = catchAsync(async (req, res) => {
  const application = await applicationService.createApplication(res.locals.auth.user.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
});

const getApplications: RequestHandler = catchAsync(async (req, res) => {
  const applications = await applicationService.getApplications(
    res.locals.auth.user.id,
    res.locals.auth.user.role,
    req.query as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Applications fetched successfully",
    data: applications,
  });
});

const getApplicationById: RequestHandler = catchAsync(async (req, res) => {
  const application = await applicationService.getApplicationById(
    getParamId(req.params.id),
    res.locals.auth.user.id,
    res.locals.auth.user.role,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application fetched successfully",
    data: application,
  });
});

const reviewApplication: RequestHandler = catchAsync(async (req, res) => {
  const application = await applicationService.reviewApplication(
    getParamId(req.params.id),
    res.locals.auth.user.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application reviewed successfully",
    data: application,
  });
});

export const applicationController = {
  createApplication,
  getApplications,
  getApplicationById,
  reviewApplication,
};

