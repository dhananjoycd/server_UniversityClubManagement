import { fromNodeHeaders } from "better-auth/node";
import type { Response } from "express";

import { auth } from "../../config/betterAuth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { loginSchema, registerSchema } from "./auth.validation";

const applyAuthHeaders = (res: Response, headers: Headers) => {
  const setCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];

  for (const cookie of setCookies) {
    res.append("set-cookie", cookie);
  }
};

const register = catchAsync(async (req, res) => {
  const body = registerSchema.parse(req.body);

  const { headers, response } = await auth.api.signUpEmail({
    headers: fromNodeHeaders(req.headers),
    body,
    returnHeaders: true,
  });

  applyAuthHeaders(res, headers);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Registration successful",
    data: response,
  });
});

const login = catchAsync(async (req, res) => {
  const body = loginSchema.parse(req.body);

  const { headers, response } = await auth.api.signInEmail({
    headers: fromNodeHeaders(req.headers),
    body,
    returnHeaders: true,
  });

  applyAuthHeaders(res, headers);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: response,
  });
});

const logout = catchAsync(async (req, res) => {
  const { headers } = await auth.api.signOut({
    headers: fromNodeHeaders(req.headers),
    returnHeaders: true,
  });

  applyAuthHeaders(res, headers);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logout successful",
    data: null,
  });
});

const getSession = catchAsync(async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Session fetched successfully",
    data: session,
  });
});

export const authController = {
  register,
  login,
  logout,
  getSession,
};

