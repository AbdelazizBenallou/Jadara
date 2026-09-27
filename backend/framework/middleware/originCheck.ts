import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const STATE_CHANGING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

function allowedOrigins(): string[] {
  if (env.CORS_ORIGINS === "*") return ["*"];
  return env.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isSameOrigin(origin: string, host: string | undefined): boolean {
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const originCheck = (req: Request, res: Response, next: NextFunction): void => {
  if (!STATE_CHANGING_METHODS.includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) {
    next();
    return;
  }

  const origins = allowedOrigins();
  const source = (origin ?? referer) as string;

  const allowed =
    origins.includes("*") ||
    origins.some((o) => {
      try {
        return o === new URL(source).origin;
      } catch {
        return false;
      }
    }) ||
    isSameOrigin(source, req.headers.host);

  if (!allowed) {
    res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
    return;
  }

  next();
};
