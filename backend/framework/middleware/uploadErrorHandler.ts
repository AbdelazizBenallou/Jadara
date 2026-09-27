import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { response } from "../utils/response.js";

export const uploadErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      response.error(res, "File too large", 413);
      return;
    }
    response.error(res, err.message, 400);
    return;
  }

  if (err.message?.startsWith("File type") || err.message?.startsWith("Avatar")) {
    response.error(res, err.message, 400);
    return;
  }

  next(err);
};
