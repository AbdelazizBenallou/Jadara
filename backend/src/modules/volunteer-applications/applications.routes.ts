import { Router } from "express";
import { applicationsController } from "./applications.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { projectReadRateLimit, projectWriteRateLimit } from "../../../framework/middleware/rateLimiter.js";
import { completedQuerySchema, listMyApplicationsQuerySchema } from "./applications.validation.js";

const router = Router();

router.use(verifyAccessToken);

/**
 * @openapi
 * /v1/volunteer-applications/me:
 *   get:
 *     summary: List the caller's own volunteer applications
 *     description: >
 *       Beneficiary-only (view_own_applications). The volunteer can track
 *       every status decision (pending/accepted/rejected) made by the
 *       Organization, plus the activity details.
 *     tags:
 *       - Volunteer Applications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, accepted, rejected, completed] }
 *     responses:
 *       200:
 *         description: Applications fetched
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/me",
  checkPermission("view_own_applications"),
  projectReadRateLimit,
  zodValidateQuery(listMyApplicationsQuerySchema),
  applicationsController.getMine,
);

/**
 * @openapi
 * /v1/volunteer-applications/completed:
 *   get:
 *     summary: List the caller's completed volunteering experiences
 *     description: >
 *       The volunteer's own completed experiences (view_own_applications),
 *       sourced from user_completed_volunteering so the CV system can consume
 *       the relationship without duplicating activity data.
 *     tags:
 *       - Volunteer Applications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: Completed volunteering experiences fetched
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/completed",
  checkPermission("view_own_applications"),
  projectReadRateLimit,
  zodValidateQuery(completedQuerySchema),
  applicationsController.completed,
);

/**
 * @openapi
 * /v1/volunteer-applications/{id}/accept:
 *   post:
 *     summary: Accept a pending volunteer application
 *     description: >
 *       Organization owner or Admin (accept_application). The application
 *       must be pending and the activity must still have capacity. The
 *       decision is never automatic.
 *     tags:
 *       - Volunteer Applications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Application accepted
 *       400:
 *         description: Not pending or activity is full
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/accept",
  checkPermission("accept_application"),
  projectWriteRateLimit,
  applicationsController.accept,
);

/**
 * @openapi
 * /v1/volunteer-applications/{id}/reject:
 *   post:
 *     summary: Reject a pending volunteer application
 *     description: >
 *       Organization owner or Admin (reject_application). The application is
 *       moved from pending to rejected.
 *     tags:
 *       - Volunteer Applications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Application rejected
 *       400:
 *         description: Not pending
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/reject",
  checkPermission("reject_application"),
  projectWriteRateLimit,
  applicationsController.reject,
);

/**
 * @openapi
 * /v1/volunteer-applications/{id}/complete:
 *   post:
 *     summary: Confirm a volunteer completed the activity
 *     description: >
 *       Organization owner or Admin (confirm_completion). The application must be
 *       accepted and the activity must have finished. ACCEPTED != COMPLETED: only
 *       this action marks actual participation. Atomically moves the application
 *       to completed and creates the user_completed_volunteering record.
 *     tags:
 *       - Volunteer Applications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Volunteer completion confirmed
 *       400:
 *         description: Not accepted, or activity has not finished yet
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/complete",
  checkPermission("confirm_completion"),
  projectWriteRateLimit,
  applicationsController.complete,
);

export default router;