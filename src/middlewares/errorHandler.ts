import { APIError } from "better-auth/api";
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { env } from "../config/env";
import AppError from "../utils/AppError";

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errorDetails: unknown = null;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof APIError) {
    statusCode = Number(error.status) || 500;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errorDetails = error.flatten();
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error:
      env.NODE_ENV === "development"
        ? {
            details: errorDetails,
            stack: error instanceof Error ? error.stack : undefined,
          }
        : errorDetails,
  });
};

export default errorHandler;
