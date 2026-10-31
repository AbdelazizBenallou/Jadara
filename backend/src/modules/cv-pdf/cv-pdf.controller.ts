import type { Request, Response } from "express";
import type { CVLanguage } from "@prisma/client";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { cvPdfService } from "./cv-pdf.service.js";
import { CV_LANGUAGES } from "./cv-pdf.constants.js";

const VALID_LANGUAGES: readonly string[] = CV_LANGUAGES;

function parseLanguage(raw: unknown): CVLanguage | undefined {
  return typeof raw === "string" && VALID_LANGUAGES.includes(raw) ? (raw as CVLanguage) : undefined;
}

export const cvPdfController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const body = req.body as { languages?: CVLanguage[]; language?: CVLanguage };
    const languages = body.languages ?? (body.language ? [body.language] : undefined);

    const result = await cvPdfService.enqueue(userId, languages);
    response.success(res, result, "CV generation queued", 202);
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    if (req.query.all === "true" || req.query.all === "1") {
      const all = await cvPdfService.getStatusAll(userId);
      response.success(res, { languages: all }, "CV status retrieved");
      return;
    }

    const language = parseLanguage(req.query.language);
    const status = await cvPdfService.getStatus(userId, language);

    if (!status) {
      response.success(res, { status: null }, "No PDF generation requests yet");
      return;
    }

    response.success(res, status, "PDF status retrieved");
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await cvPdfService.getHistory(
      userId,
      req.query as { page?: string; limit?: string },
    );
    response.paginated(res, result.requests, result.meta, "PDF history retrieved");
  }),
};
