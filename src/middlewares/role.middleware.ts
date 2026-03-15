import { Role } from "@prisma/client";
import type { RequestHandler } from "express";

import AppError from "../utils/AppError";

export const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;
export const MANAGEMENT_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.EVENT_MANAGER] as const;

const roleMiddleware = (...allowedRoles: Role[]): RequestHandler => {
  return (_req, res, next) => {
    const userRole = res.locals.auth?.user?.role as Role | undefined;

    if (!userRole) {
      next(new AppError(401, "Unauthorized"));
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      next(new AppError(403, "Forbidden"));
      return;
    }

    next();
  };
};

export default roleMiddleware;
