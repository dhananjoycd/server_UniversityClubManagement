import type { Express } from "express";
import type { UploadApiResponse } from "cloudinary";

import cloudinary from "../../config/cloudinary";
import AppError from "../../utils/AppError";

const uploadImage = async (file: Express.Multer.File | undefined, folder = "server-club") => {
  if (!file) {
    throw new AppError(400, "File is required");
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError(500, "Cloudinary is not configured");
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

export const uploadService = {
  uploadImage,
};
