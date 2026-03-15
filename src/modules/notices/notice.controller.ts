import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { noticeService } from "./notice.service";

const getParamId = (id: string | string[] | undefined) => Array.isArray(id) ? id[0] : id ?? "";

const getNotices: RequestHandler = catchAsync(async (req, res) => {
  const notices = await noticeService.getNotices(res.locals.auth.user.role, req.query as Record<string, unknown>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notices fetched successfully",
    data: notices,
  });
});

const getNoticeById: RequestHandler = catchAsync(async (req, res) => {
  const notice = await noticeService.getNoticeById(getParamId(req.params.id), res.locals.auth.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notice fetched successfully",
    data: notice,
  });
});

const createNotice: RequestHandler = catchAsync(async (req, res) => {
  const notice = await noticeService.createNotice(res.locals.auth.user.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Notice created successfully",
    data: notice,
  });
});

const updateNotice: RequestHandler = catchAsync(async (req, res) => {
  const notice = await noticeService.updateNotice(getParamId(req.params.id), req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notice updated successfully",
    data: notice,
  });
});

const deleteNotice: RequestHandler = catchAsync(async (req, res) => {
  await noticeService.deleteNotice(getParamId(req.params.id));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notice deleted successfully",
    data: null,
  });
});

export const noticeController = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
};

