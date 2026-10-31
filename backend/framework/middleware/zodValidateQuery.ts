import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { response } from "../utils/response.js";

export const zodValidateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(422).json({
        success: false,
        message: "Query validation failed",
        errors,
      });
      return;
    }
    // In Express 5, req.query is a lazy getter that returns a fresh object on
    // every access, so mutating it does not persist. Redefine it as a plain
    // writable property holding the validated (coerced, defaulted) data.
    Object.defineProperty(req, "query", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: result.data,
    });
    next();
  };
};
