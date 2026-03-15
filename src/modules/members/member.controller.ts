import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { memberService } from "./member.service";

const getParamId = (id: string | string[] | undefined) => (Array.isArray(id) ? id[0] : (id ?? ""));

const getMembers: RequestHandler = catchAsync(async (req, res) => {
  const result = await memberService.getMembers(req.query as Record<string, unknown>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Members fetched successfully",
    data: result,
  });
});

const getMemberById: RequestHandler = catchAsync(async (req, res) => {
  const member = await memberService.getMemberById(
    getParamId(req.params.id),
    res.locals.auth.user.id,
    res.locals.auth.user.role,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Member fetched successfully",
    data: member,
  });
});

const updateMember: RequestHandler = catchAsync(async (req, res) => {
  const member = await memberService.updateMember(
    getParamId(req.params.id),
    res.locals.auth.user.id,
    res.locals.auth.user.role,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Member updated successfully",
    data: member,
  });
});

export const memberController = {
  getMembers,
  getMemberById,
  updateMember,
};
