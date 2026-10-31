import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { response } from "../utils/response.js";
import logger from "../config/logger.js";

interface BodyParserError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
  expose?: boolean;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    logger.error(
      {
        err,
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
        requestId: req.requestId,
      },
      "Application error",
    );
    response.error(res, err.message, err.statusCode, err.details);
    return;
  }

  const bodyErr = err as BodyParserError;
  if (bodyErr.type === "entity.too.large") {
    logger.warn(
      { path: req.path, method: req.method, requestId: req.requestId },
      "Request body too large",
    );
    response.error(res, "Request body too large", 413);
    return;
  }

  if (
    bodyErr.expose &&
    bodyErr.statusCode &&
    bodyErr.statusCode >= 400 &&
    bodyErr.statusCode < 500
  ) {
    logger.warn(
      { err, path: req.path, method: req.method, requestId: req.requestId },
      "Client request error",
    );
    response.error(res, err.message, bodyErr.statusCode);
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    logger.error(
      { err, path: req.path, method: req.method, requestId: req.requestId },
      "Invalid JSON",
    );
    response.error(res, "Invalid JSON in request body", 400);
    return;
  }

  logger.error(
    { err, path: req.path, method: req.method, requestId: req.requestId },
    "Unhandled error",
  );
  response.error(res, "Internal server error", 500);
};
