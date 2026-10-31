import { Router } from "express";
import { organizationController } from "./organizations.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { updateOrganizationSchema } from "./organizations.validation.js";
import {
  getUserRateLimit,
  updateUserRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

// Self-service routes only. An organization is created when the Admin approves
// the Organization registration demand, and is always scoped to its owner.
router.use(verifyAccessToken);

/**
 * @openapi
 * /v1/organizations/me:
 *   get:
 *     summary: Get the authenticated user's organization
 *     description: >
 *       Returns the organization owned by the authenticated user. Requires
 *       view_organizations permission.
 *     tags:
 *       - Organizations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Organization fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/me",
  checkPermission("view_organizations"),
  getUserRateLimit,
  organizationController.getMine,
);

/**
 * @openapi
 * /v1/organizations/me:
 *   patch:
 *     summary: Update the authenticated user's organization
 *     description: >
 *       Updates only the organization owned by the authenticated user. Requires
 *       update_organization permission.
 *     tags:
 *       - Organizations
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Jadara Foundation
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 nullable: true
 *               website:
 *                 type: string
 *                 format: uri
 *                 maxLength: 500
 *                 nullable: true
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *               phone:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *               location:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Organization updated successfully
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
  checkPermission("update_organization"),
  updateUserRateLimit,
  zodValidate(updateOrganizationSchema),
  organizationController.updateMine,
);

/**
 * @openapi
 * /v1/organizations/me:
 *   delete:
 *     summary: Delete the authenticated user's organization
 *     description: >
 *       Deletes only the organization owned by the authenticated user. Requires
 *       delete_organization permission.
 *     tags:
 *       - Organizations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/me",
  checkPermission("delete_organization"),
  updateUserRateLimit,
  organizationController.removeMine,
);

export default router;