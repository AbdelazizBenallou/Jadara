import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtUtils } from "../utils/jwt.js";
import { response } from "../utils/response.js";
import prisma from "../config/prisma.js";

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    response.error(res, "Unauthorized", 401);
    return;
  }

  let decoded: { userId: number; email: string; role: string };
  try {
    decoded = jwtUtils.verifyAccessToken(token);
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      response.error(res, "Access token expired", 401);
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      response.error(res, "Invalid token", 401);
      return;
    }
    response.error(res, "Token verification failed", 401);
    return;
  }

  if (!decoded.userId) {
    response.error(res, "Invalid token: missing user ID", 401);
    return;
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
    select: { status: true },
  });

  if (!user) {
    response.error(res, "User not found", 401);
    return;
  }

  if (user.status !== "active") {
    response.error(res, "Account is not active", 403);
    return;
  }

  req.user = decoded;
  next();
};
