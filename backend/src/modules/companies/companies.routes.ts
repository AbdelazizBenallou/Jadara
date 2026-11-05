import { Router } from "express";
import { companyController } from "./companies.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { updateCompanySchema } from "./companies.validator.js";
import {
  getUserRateLimit,
  updateUserRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

// All self-service company profile endpoints require an authenticated, active account
router.use(verifyAccessToken);

/**
 * @openapi
 * /v1/companies/me:
 *   get:
 *     summary: Get authenticated user's company profile
 *     description: >
 *       Returns the company record owned by the authenticated user.
 *       Requires view_company_profile permission.
 *     tags:
 *       - Companies
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/me",
  checkPermission("view_company_profile"),
  getUserRateLimit,
  companyController.getMine,
);

/**
 * @openapi
 * /v1/companies/me:
 *   patch:
 *     summary: Update authenticated user's company profile name
 *     description: >
 *       Updates the name of the company owned by the authenticated user.
 *       Requires view_company_profile permission. Only `name` is mutable.
 *     tags:
 *       - Companies
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Jadara Tech Solutions
 *     responses:
 *       200:
 *         description: Company profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/me",
  checkPermission("view_company_profile"),
  updateUserRateLimit,
  zodValidate(updateCompanySchema),
  companyController.updateMine,
);

export default router;
