import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

const validateRequest = (
  schema: ZodType,
  target: "body" | "query" | "params" = "body",
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(result.error);
      return;
    }

    if (target === "body") {
      req.body = result.data;
    } else {
      res.locals.validated ??= {};
      res.locals.validated[target] = result.data;
    }

    next();
  };
};

export default validateRequest;
