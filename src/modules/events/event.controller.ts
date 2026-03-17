import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { eventService } from "./event.service";

const getParamId = (id: string | string[] | undefined) => (Array.isArray(id) ? id[0] : (id ?? ""));

const getEvents: RequestHandler = catchAsync(async (req, res) => {
  const result = await eventService.getEvents(req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: 200, success: true, message: "Events fetched successfully", data: result });
});

const getEventById: RequestHandler = catchAsync(async (req, res) => {
  const event = await eventService.getEventById(getParamId(req.params.id));
  sendResponse(res, { statusCode: 200, success: true, message: "Event fetched successfully", data: event });
});

const createEvent: RequestHandler = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(res.locals.auth.user.id, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: req.body.sendEmail ? "Event created and email delivery attempted" : "Event created successfully",
    data: event,
  });
});

const updateEvent: RequestHandler = catchAsync(async (req, res) => {
  const event = await eventService.updateEvent(getParamId(req.params.id), req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: req.body.sendEmail ? "Event updated and email delivery attempted" : "Event updated successfully",
    data: event,
  });
});

const deleteEvent: RequestHandler = catchAsync(async (req, res) => {
  await eventService.deleteEvent(getParamId(req.params.id));
  sendResponse(res, { statusCode: 200, success: true, message: "Event deleted successfully", data: null });
});

const registerForEvent: RequestHandler = catchAsync(async (req, res) => {
  const registration = await eventService.registerForEvent(getParamId(req.params.id), res.locals.auth.user.id, res.locals.auth.user.role);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: registration.requiresPayment ? "Stripe checkout created successfully" : "Event registration created successfully",
    data: registration,
  });
});

const markPaymentVerificationFailed: RequestHandler = catchAsync(async (req, res) => {
  const registration = await eventService.markPaymentVerificationFailed(getParamId(req.params.id), res.locals.auth.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: registration ? "Payment verification marked as failed" : "No pending payment verification was found",
    data: registration,
  });
});

export const eventController = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, registerForEvent, markPaymentVerificationFailed };
