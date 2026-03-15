import type { RequestHandler } from "express";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { uploadService } from "./upload.service";

const uploadImage: RequestHandler = catchAsync(async (req, res) => {
  const result = await uploadService.uploadImage(req.file, req.body.folder);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Image uploaded successfully",
    data: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
});

export const uploadController = {
  uploadImage,
};
