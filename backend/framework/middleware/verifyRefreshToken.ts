import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtUtils } from "../utils/jwt.js";
import { response } from "../utils/response.js";
import prisma from "../config/prisma.js";
import { hash } from "../utils/hash.js";

export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    response.error(res, "Refresh token required", 401);
    return;
  }

  let decoded: { userId: number; email: string };
  try {
    decoded = jwtUtils.verifyRefreshToken(token);
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      response.error(res, "Refresh token expired", 401);
      return;
    }
    response.error(res, "Invalid refresh token", 401);
    return;
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
    select: { status: true },
  });

  if (!user || user.status !== "active") {
    response.error(res, "Invalid refresh token", 401);
    return;
  }

  // Verify token exists in DB (not revoked)
  const storedTokens = await prisma.refresh_tokens.findMany({
    where: { user_id: decoded.userId, expires_at: { gt: new Date() } },
  });

  let valid = false;
  for (const t of storedTokens) {
    if (await hash.verifyToken(t.token, token).catch(() => false)) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    response.error(res, "Refresh token revoked", 401);
    return;
  }

  req.refreshPayload = decoded;
  next();
};
