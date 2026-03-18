import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userService } from "./user.service";

const getParamId = (id: string | string[] | undefined) => (Array.isArray(id) ? id[0] : (id ?? ""));

const getUsers: RequestHandler = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query as Record<string, unknown>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

const getUserById: RequestHandler = catchAsync(async (req, res) => {
  const result = await userService.getUserById(getParamId(req.params.id));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateUserRole: RequestHandler = catchAsync(async (req, res) => {
  const result = await userService.updateUserRole(
    getParamId(req.params.id),
    res.locals.auth.user.id,
    res.locals.auth.user.role,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

export const userController = {
  getUsers,
  getUserById,
  updateUserRole,
};
