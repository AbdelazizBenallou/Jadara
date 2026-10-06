import { Router } from "express";
import { demandController } from "./demands.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { upload } from "../../../framework/middleware/upload.js";
import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";
import {
  listDemandsSchema,
  reviewDemandSchema,
  submitDemandSchema,
} from "./demands.validator.js";
import {
  registerRateLimit,
  listUsersRateLimit,
  getUserRateLimit,
  updateUserRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

// ── Public: submit a registration demand ──────────────────────
/**
 * @openapi
 * /v1/registration-demands:
 *   post:
 *     summary: Submit a registration demand
 *     description: >
 *       Creates a temporary account and a PENDING registration demand for the
 *       Reviewer, Company or Organization role. The account cannot sign in or
 *       use any role-specific feature until an Admin approves the demand.
 *     tags:
 *       - Demands
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - files
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Reviewer, Company, Organization]
 *                 example: Organization
 *               email:
 *                 type: string
 *                 format: email
 *                 example: applicant@jadara.dev
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               first_name:
 *                 type: string
 *                 example: Alex
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *                 example: Male
 *               domain_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Required when role is Reviewer
 *                 example: [1, 2]
 *               organization:
 *                 type: object
 *                 description: Required when role is Organization
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Jadara Foundation
 *                   description:
 *                     type: string
 *                   website:
 *                     type: string
 *                     format: uri
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   location:
 *                     type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: At least one supporting document
 *     responses:
 *       201:
 *         description: Demand submitted for review
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Conflict - Email already registered
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
const publicRouter = Router();

publicRouter.post(
  "/",
  registerRateLimit,
  upload.array("files", 5),
  uploadErrorHandler,
  zodValidate(submitDemandSchema),
  demandController.submit,
);

export { publicRouter as registrationDemandRoutes };

/**
 * @openapi
 * /v1/registration-demands/mine:
 *   get:
 *     summary: Get the caller's own latest registration demand
 *     description: >
 *       Returns only the authenticated caller's demand. Available once the
 *       account has been approved, since inactive and pending accounts are
 *       rejected by verifyAccessToken.
 *     tags:
 *       - Demands
 *     responses:
 *       200:
 *         description: Demand fetched
 *       404:
 *         description: No demand found
 */
publicRouter.get("/mine", verifyAccessToken, getUserRateLimit, demandController.getMine);

// ── Admin review ───────────────────────────────────────────────
/**
 * @openapi
 * /v1/demands:
 *   get:
 *     summary: List registration demands
 *     tags:
 *       - Demands
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Reviewer, Company, Organization]
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demands fetched
 */
router.use(verifyAccessToken, checkPermission("manage_users"));

router.get(
  "/",
  listUsersRateLimit,
  zodValidateQuery(listDemandsSchema),
  demandController.getAll,
);
router.get("/:id", getUserRateLimit, demandController.getById);

/**
 * @openapi
 * /v1/demands/{id}/approve:
 *   post:
 *     summary: Approve a registration demand
 *     description: >
 *       Activates the temporary account, grants the requested role and sends an
 *       approval email. The email is sent outside the database transaction.
 *     tags:
 *       - Demands
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Demand approved
 *       403:
 *         description: Forbidden - reviewing your own demand
 *       409:
 *         description: Demand is already reviewed
 */
router.post(
  "/:id/approve",
  updateUserRateLimit,
  zodValidate(reviewDemandSchema),
  demandController.approve,
);

/**
 * @openapi
 * /v1/demands/{id}/reject:
 *   post:
 *     summary: Reject a registration demand
 *     description: >
 *       Marks the demand REJECTED and sends a rejection email. The temporary
 *       account is deleted only after the mail provider accepts the email; the
 *       demand record is always kept for audit.
 *     tags:
 *       - Demands
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Demand rejected
 *       403:
 *         description: Forbidden - reviewing your own demand
 *       409:
 *         description: Demand is already reviewed
 */
router.post(
  "/:id/reject",
  updateUserRateLimit,
  zodValidate(reviewDemandSchema),
  demandController.reject,
);

/**
 * @openapi
 * /v1/demands/{id}/resend-notification:
 *   post:
 *     summary: Re-send a decision notification
 *     description: >
 *       Retries the approval or rejection email. For a rejection whose first
 *       send failed, this also completes the temporary account deletion.
 *     tags:
 *       - Demands
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification sent
 *       409:
 *         description: Demand has not been reviewed yet
 *       502:
 *         description: Email provider rejected the send
 */
router.post("/:id/resend-notification", updateUserRateLimit, demandController.resendNotification);

export default router;