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
    const query = req.query as Record<string, unknown>;
    for (const key of Object.keys(query)) delete query[key];
    Object.assign(query, result.data);
    next();
  };
};
