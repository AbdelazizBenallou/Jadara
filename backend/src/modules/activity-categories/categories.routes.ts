import { Router } from "express";
import { activityCategoryController } from "./categories.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { skillRateLimit } from "../../../framework/middleware/rateLimiter.js";
import {
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from "./categories.validation.js";

const router = Router();

router.use(verifyAccessToken);

/**
 * @openapi
 * /v1/activity-categories:
 *   get:
 *     summary: List activity categories
 *     description: >
 *       Requires `view_activities`, which the baseline grants to Organization
 *       and Admin. Organizations use this to populate the category picker on
 *       the create-activity form. Creating, editing and deleting categories
 *       is Admin-only via `manage_activity_categories`.
 *     tags:
 *       - Activities
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
 *         name: q
 *         description: Case-insensitive name search
 *         schema: { type: string, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Activity categories fetched
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/",
  checkPermission("view_activities"),
  skillRateLimit,
  zodValidateQuery(listCategoriesSchema),
  activityCategoryController.getAll,
);

/**
 * @openapi
 * /v1/activity-categories:
 *   post:
 *     summary: Create an activity category (Admin)
 *     description: Admin-only. `name` is unique.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Environment
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Conservation, cleanup, climate and wildlife
 *     responses:
 *       201:
 *         description: Activity category created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Activity category name already exists
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  checkPermission("manage_activity_categories"),
  skillRateLimit,
  zodValidate(createCategorySchema),
  activityCategoryController.create,
);

/**
 * @openapi
 * /v1/activity-categories/{id}:
 *   patch:
 *     summary: Update an activity category (Admin)
 *     description: Admin-only. Send `name`, `description` or both.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               description: { type: string, maxLength: 500, nullable: true }
 *     responses:
 *       200:
 *         description: Activity category updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Activity category name already exists
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/:id",
  checkPermission("manage_activity_categories"),
  skillRateLimit,
  zodValidate(updateCategorySchema),
  activityCategoryController.update,
);

/**
 * @openapi
 * /v1/activity-categories/{id}:
 *   delete:
 *     summary: Delete an activity category (Admin)
 *     description: >
 *       Admin-only. Refused while any activity references the category,
 *       because the foreign key is ON DELETE SET NULL and deleting would
 *       silently clear the category from those activities.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Activity category deleted
 *       400:
 *         description: 'Cannot delete category - linked to N activity(activities). Reassign them first.'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  checkPermission("manage_activity_categories"),
  skillRateLimit,
  activityCategoryController.remove,
);

export default router;
