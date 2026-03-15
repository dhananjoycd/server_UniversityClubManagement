import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";

import { auth } from "../config/betterAuth";
import { prisma } from "../lib/prisma";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

const authMiddleware: RequestHandler = catchAsync(async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    next(new AppError(401, "Unauthorized"));
    return;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!dbUser) {
    next(new AppError(401, "Unauthorized"));
    return;
  }

  res.locals.auth = {
    ...session,
    user: {
      ...session.user,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
    },
  };

  next();
});

export default authMiddleware;

