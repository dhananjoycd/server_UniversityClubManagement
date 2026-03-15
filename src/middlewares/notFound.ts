import type { RequestHandler } from "express";

import AppError from "../utils/AppError";

const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
};

export default notFound;
