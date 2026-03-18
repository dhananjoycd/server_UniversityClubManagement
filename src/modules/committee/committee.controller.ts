import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { committeeService } from "./committee.service";

const getParamId = (id: string | string[] | undefined) => (Array.isArray(id) ? id[0] : (id ?? ""));

const getPublicCommittee: RequestHandler = catchAsync(async (_req, res) => {
  const result = await committeeService.getPublicCommittee();
  sendResponse(res, { statusCode: 200, success: true, message: "Committee data fetched successfully", data: result });
});

const getAdminCommitteeSessions: RequestHandler = catchAsync(async (_req, res) => {
  const result = await committeeService.getAdminCommitteeSessions();
  sendResponse(res, { statusCode: 200, success: true, message: "Committee sessions fetched successfully", data: result });
});

const getEligibleMembers: RequestHandler = catchAsync(async (_req, res) => {
  const result = await committeeService.getEligibleMembers();
  sendResponse(res, { statusCode: 200, success: true, message: "Eligible members fetched successfully", data: result });
});

const createCommitteeSession: RequestHandler = catchAsync(async (req, res) => {
  const result = await committeeService.createCommitteeSession(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Committee session created successfully", data: result });
});

const updateCommitteeSession: RequestHandler = catchAsync(async (req, res) => {
  const result = await committeeService.updateCommitteeSession(getParamId(req.params.id), req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Committee session updated successfully", data: result });
});

const deleteCommitteeSession: RequestHandler = catchAsync(async (req, res) => {
  const result = await committeeService.deleteCommitteeSession(getParamId(req.params.id));
  sendResponse(res, { statusCode: 200, success: true, message: "Committee session deleted successfully", data: result });
});

const createCommitteeAssignment: RequestHandler = catchAsync(async (req, res) => {
  const result = await committeeService.createCommitteeAssignment(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Committee assignment created successfully", data: result });
});

const updateCommitteeAssignment: RequestHandler = catchAsync(async (req, res) => {
  const result = await committeeService.updateCommitteeAssignment(getParamId(req.params.id), req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Committee assignment updated successfully", data: result });
});

const deleteCommitteeAssignment: RequestHandler = catchAsync(async (req, res) => {
  const result = await committeeService.deleteCommitteeAssignment(getParamId(req.params.id));
  sendResponse(res, { statusCode: 200, success: true, message: "Committee assignment deleted successfully", data: result });
});

export const committeeController = {
  getPublicCommittee,
  getAdminCommitteeSessions,
  getEligibleMembers,
  createCommitteeSession,
  updateCommitteeSession,
  deleteCommitteeSession,
  createCommitteeAssignment,
  updateCommitteeAssignment,
  deleteCommitteeAssignment,
};
