import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { contactService } from "./contact.service";

const getParamId = (id: string | string[] | undefined) => (Array.isArray(id) ? id[0] : (id ?? ""));

const createContactMessage: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.createContactMessage(res.locals.auth.user.id, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Contact message sent successfully", data: result });
});

const getMyContactMessages: RequestHandler = catchAsync(async (_req, res) => {
  const result = await contactService.getMyContactMessages(res.locals.auth.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your contact messages fetched successfully", data: result });
});

const getAdminContactMessages: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.getAdminContactMessages(req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: 200, success: true, message: "Admin contact inbox fetched successfully", data: result });
});

const reviewContactMessage: RequestHandler = catchAsync(async (req, res) => {
  const result = await contactService.reviewContactMessage(getParamId(req.params.id), res.locals.auth.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Contact message updated successfully", data: result });
});

export const contactController = {
  createContactMessage,
  getMyContactMessages,
  getAdminContactMessages,
  reviewContactMessage,
};
