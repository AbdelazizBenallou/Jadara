import type { Request, Response } from "express";
import type { CVLanguage } from "@prisma/client";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { cvPdfService } from "./cv-pdf.service.js";

const VALID_LANGUAGES: readonly CVLanguage[] = ["AR", "EN", "FR"] as const;

export const cvPdfController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const body = req.body as { language?: string };
    const language: CVLanguage =
      body?.language && VALID_LANGUAGES.includes(body.language as CVLanguage)
        ? (body.language as CVLanguage)
        : "EN";
    const result = await cvPdfService.generate(userId, language);

    if (result.status === "incomplete") {
      response.success(
        res,
        {
          status: "incomplete",
          missing_fields: result.missing,
        },
        "CV data incomplete — please fill missing fields",
      );
      return;
    }

    let downloadUrl: string | null = null;
    if (result.download_url) {
      const { storage } = await import("../../../framework/utils/storage.js");
      const { BUCKETS } = await import("../../../framework/config/minio.js");
      downloadUrl = await storage.getPresignedUrl(BUCKETS.documents, result.download_url);
    }

    response.success(
      res,
      {
        status: "completed",
        download_url: downloadUrl,
      },
      result.existing
        ? "No changes detected — returning existing PDF"
        : "PDF generated successfully",
      result.existing ? 200 : 201,
    );
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const rawLang = req.query.language as string | undefined;
    const language: CVLanguage | undefined =
      rawLang && VALID_LANGUAGES.includes(rawLang as CVLanguage)
        ? (rawLang as CVLanguage)
        : undefined;
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

