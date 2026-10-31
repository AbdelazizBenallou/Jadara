import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { authService } from "./auth.service.js";
import { response } from "../../../framework/utils/response.js";
import type { RegisterInput, LoginInput, ChangePasswordInput } from "./auth.validator.js";

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie("accessToken", token, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
    path: "/",
  });
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
    path: "/v1/auth",
  });
}

function clearAccessTokenCookie(res: Response): void {
  res.clearCookie("accessToken", {
    ...COOKIE_OPTIONS,
    path: "/",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    ...COOKIE_OPTIONS,
    path: "/v1/auth",
  });
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RegisterInput;
    const result = await authService.register(data);

    setAccessTokenCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);

    response.success(res, { user: result.user }, "Registration successful", 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as LoginInput;
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const result = await authService.login(data, ip, userAgent);
    setAccessTokenCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    response.success(res, { user: result.user }, "Login successful");
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.refreshPayload!.userId;
    const result = await authService.refreshAccessToken(userId);
    setAccessTokenCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    response.success(res, null, "Token refreshed");
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = req.body as ChangePasswordInput;
    await authService.changePassword(userId, data);
    clearAccessTokenCookie(res);
    clearRefreshCookie(res);
    response.success(res, null, "Password changed successfully");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await authService.logout(userId);
    clearAccessTokenCookie(res);
    clearRefreshCookie(res);
    response.success(res, null, "Logged out successfully");
  }),
};
