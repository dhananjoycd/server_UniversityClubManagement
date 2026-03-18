import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { testimonialService } from "./testimonial.service";

const getParamId = (id: string | string[] | undefined) => (Array.isArray(id) ? id[0] : (id ?? ""));

const getPublicTestimonials: RequestHandler = catchAsync(async (_req, res) => {
  const result = await testimonialService.getPublicTestimonials();
  sendResponse(res, { statusCode: 200, success: true, message: "Testimonials fetched successfully", data: result });
});

const createTestimonial: RequestHandler = catchAsync(async (req, res) => {
  const result = await testimonialService.createTestimonial(res.locals.auth.user.id, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Testimonial submitted successfully", data: result });
});

const getMyTestimonials: RequestHandler = catchAsync(async (_req, res) => {
  const result = await testimonialService.getMyTestimonials(res.locals.auth.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your testimonials fetched successfully", data: result });
});

const getAdminTestimonials: RequestHandler = catchAsync(async (req, res) => {
  const result = await testimonialService.getAdminTestimonials(req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: 200, success: true, message: "Admin testimonials fetched successfully", data: result });
});

const reviewTestimonial: RequestHandler = catchAsync(async (req, res) => {
  const result = await testimonialService.reviewTestimonial(getParamId(req.params.id), res.locals.auth.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Testimonial reviewed successfully", data: result });
});

export const testimonialController = {
  getPublicTestimonials,
  createTestimonial,
  getMyTestimonials,
  getAdminTestimonials,
  reviewTestimonial,
};
