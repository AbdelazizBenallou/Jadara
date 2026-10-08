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

/**
 * @openapi
 * /v1/cv-pdf/pdf-generate:
 *   post:
 *     summary: Generate the caller's CV PDF
 *     description: >
 *       Builds the CV from the profile model (full name, phone, email plus
 *       education, work experience, skills, languages, certifications,
 *       projects and completed volunteering). Social media is NOT included.
 *       Same data = cached PDF (200); new/changed data = new PDF (201).
 *     tags:
 *       - CV
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [AR, EN, FR]
 *                 default: EN
 *     responses:
 *       201:
 *         description: PDF generated
 *       200:
 *         description: No changes detected — existing PDF returned
 *       400:
 *         description: CV data incomplete (missing_fields)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/pdf-generate", pdfGenerateRateLimit, cvPdfController.generate);

/**
 * @openapi
 * /v1/cv-pdf/pdf-status:
 *   get:
 *     summary: Latest PDF generation status
 *     description: Latest request for the caller (optionally per language).
 *     tags:
 *       - CV
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema: { type: string, enum: [AR, EN, FR] }
 *     responses:
 *       200:
 *         description: Status retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/pdf-status", cvReadRateLimit, cvPdfController.getStatus);

/**
 * @openapi
 * /v1/cv-pdf/pdf-history:
 *   get:
 *     summary: Paginated PDF generation history
 *     description: The caller's CV generation requests, newest first.
 *     tags:
 *       - CV
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5, minimum: 1, maximum: 20 }
 *     responses:
 *       200:
 *         description: History retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/pdf-history",
  cvReadRateLimit,
  zodValidateQuery(listPdfRequestsSchema),
  cvPdfController.getHistory,
);

export default router;