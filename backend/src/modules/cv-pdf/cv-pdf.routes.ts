import { Router } from "express";
import { cvPdfController } from "./cv-pdf.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { listPdfRequestsSchema } from "./cv-pdf.validator.js";
import {
  pdfGenerateRateLimit,
  cvReadRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();
router.use(verifyAccessToken);

router.post("/pdf-generate", pdfGenerateRateLimit, cvPdfController.generate);
router.get("/pdf-status", cvReadRateLimit, cvPdfController.getStatus);
router.get(
  "/pdf-history",
  cvReadRateLimit,
  zodValidateQuery(listPdfRequestsSchema),
  cvPdfController.getHistory,
);

export default router;
