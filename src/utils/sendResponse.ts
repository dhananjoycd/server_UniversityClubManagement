import type { Response } from "express";

type SendResponseParams<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
};

const sendResponse = <T>(
  res: Response,
  { statusCode, success, message, data }: SendResponseParams<T>,
) => {
  return res.status(statusCode).json({
    success,
    message,
    data: data ?? null,
  });
};

export default sendResponse;
