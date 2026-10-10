import { Router } from "express";
import { cvPdfController } from "./cv-pdf.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { generateCvSchema, listPdfRequestsSchema } from "./cv-pdf.validator.js";
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
 *     summary: Queue the caller's CV PDF generation
 *     description: >
 *       Asynchronously builds the CV from the profile model (full name, phone,
 *       email plus education, work experience, skills, languages,
 *       certifications, projects and completed volunteering). Social media is
 *       NOT included. Every section is optional. When the stored version is
 *       already up to date it is returned immediately (cached=true);
 *       otherwise one job per requested language is queued and can be polled
 *       via GET /v1/cv-pdf/pdf-status. Currently only EN and FR are renderable.
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
 *               languages:
 *                 type: array
 *                 items: { type: string, enum: [AR, EN, FR] }
 *                 description: Defaults to all renderable languages (EN, FR)
 *               language:
 *                 type: string
 *                 enum: [AR, EN, FR]
 *                 description: Backwards-compatible single-language shorthand
 *     responses:
 *       202:
 *         description: Generation queued (and/or cached versions returned)
 *       400:
 *         description: Unsupported language requested
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/pdf-generate",
  pdfGenerateRateLimit,
  zodValidate(generateCvSchema),
  cvPdfController.generate,
);

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
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: When true, returns the latest status for every language.
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