import { Router } from "express";
import { activitiesController } from "./activities.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { upload } from "../../../framework/middleware/upload.js";
import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";
import {
  projectReadRateLimit,
  projectWriteRateLimit,
  reviewDecisionRateLimit,
} from "../../../framework/middleware/rateLimiter.js";
import {
  addSkillsSchema,
  createActivitySchema,
  listActivitiesSchema,
  updateActivitySchema,
} from "./activities.validation.js";

const router = Router();

router.use(verifyAccessToken);

/**
 * @openapi
 * /v1/activities:
 *   post:
 *     summary: Create a volunteering activity
 *     description: >
 *       Organization-only. Creates the activity in `pending_review` together
 *       with its mandatory authorization document, then the Admin reviews it.
 *       An organization with no row (Beneficiary, Reviewer, Company, Admin)
 *       is rejected with 403. `status` cannot be supplied: it can only be
 *       changed through Admin review.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, start_date, end_date, capacity, authorization_file]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Beach cleanup campaign
 *               description:
 *                 type: string
 *                 example: Weekly cleanup along the coastline.
 *               location:
 *                 type: string
 *                 example: Amman beach
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-11-01"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-11-03"
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 25
 *               requirements:
 *                 type: string
 *                 example: Volunteers must bring gloves.
 *               registration_deadline:
 *                 type: string
 *                 format: date-time
 *               category_id:
 *                 type: integer
 *               required_skill_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Must all exist or the request fails with 400 and missing_skills
 *                 example: [1, 2]
 *               authorization_file:
 *                 type: string
 *                 format: binary
 *                 description: Mandatory authorization document (PDF/Office/image/zip/txt)
 *     responses:
 *       201:
 *         description: Activity created in pending_review
 *       400:
 *         description: Missing file, unknown skill/category, invalid file type
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  checkPermission("create_activity"),
  projectWriteRateLimit,
  upload.single("authorization_file"),
  uploadErrorHandler,
  zodValidate(createActivitySchema),
  activitiesController.create,
);

/**
 * @openapi
 * /v1/activities/all:
 *   get:
 *     summary: List every activity (Admin moderation queue)
 *     description: >
 *       Admin-only. Cross-organization list used to review activities in
 *       `pending_review`. Must be registered before `/v1/activities/:id`.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_review, published, rejected, ongoing, completed, cancelled]
 *       - in: query
 *         name: q
 *         description: Case-insensitive title search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Activities fetched
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/all",
  checkPermission("approve_activity"),
  projectReadRateLimit,
  zodValidateQuery(listActivitiesSchema),
  activitiesController.getAll,
);

/**
 * @openapi
 * /v1/activities:
 *   get:
 *     summary: List the caller's own activities
 *     description: >
 *       Organization-only. Always scoped to the caller's organization; no
 *       organization ID is accepted from the request.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_review, published, rejected, ongoing, completed, cancelled]
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Activities fetched
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/",
  checkPermission("view_activities"),
  projectReadRateLimit,
  zodValidateQuery(listActivitiesSchema),
  activitiesController.getMine,
);

/**
 * @openapi
 * /v1/activities/{id}:
 *   get:
 *     summary: Get an activity
 *     description: >
 *       Returns the caller's own activity, or any activity for Admin. Another
 *       organization's activity returns 404 so IDs cannot be enumerated.
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
 *         description: Activity fetched
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  checkPermission("view_activities"),
  projectReadRateLimit,
  activitiesController.getById,
);

/**
 * @openapi
 * /v1/activities/{id}:
 *   patch:
 *     summary: Update an activity
 *     description: >
 *       Organization-only and scoped to the caller's own activity; Admin may
 *       update any. `status` must not be sent: use /approve or /reject.
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
 *               title: { type: string, maxLength: 255 }
 *               description: { type: string, nullable: true }
 *               location: { type: string, nullable: true }
 *               start_date: { type: string, format: date-time }
 *               end_date: { type: string, format: date-time }
 *               capacity: { type: integer, minimum: 1 }
 *               requirements: { type: string, nullable: true }
 *               registration_deadline: { type: string, format: date-time, nullable: true }
 *               category_id: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Activity updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/:id",
  checkPermission("update_activity"),
  projectWriteRateLimit,
  zodValidate(updateActivitySchema),
  activitiesController.update,
);

/**
 * @openapi
 * /v1/activities/{id}:
 *   delete:
 *     summary: Delete an activity
 *     description: >
 *       Organization-only and scoped to the caller's own activity; Admin may
 *       delete any. The stored authorization document is removed with it.
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
 *         description: Activity deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  checkPermission("delete_activity"),
  projectWriteRateLimit,
  activitiesController.remove,
);

/**
 * @openapi
 * /v1/activities/{id}/skills:
 *   post:
 *     summary: Add required skills to an activity
 *     description: >
 *       Organization-only and scoped to the caller's own activity. Every ID
 *       must exist: a single unknown ID fails the whole request with 400 and
 *       `missing_skills`, and nothing is written. Existing links are ignored.
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
 *             required: [required_skill_ids]
 *             properties:
 *               required_skill_ids:
 *                 type: array
 *                 minItems: 1
 *                 items: { type: integer }
 *                 example: [1, 2]
 *     responses:
 *       200:
 *         description: Skills added
 *       400:
 *         description: Some selected skills do not exist
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/skills",
  checkPermission("update_activity"),
  projectWriteRateLimit,
  zodValidate(addSkillsSchema),
  activitiesController.addSkills,
);

/**
 * @openapi
 * /v1/activities/{id}/skills/{skillId}:
 *   delete:
 *     summary: Remove a required skill from an activity
 *     description: >
 *       Organization-only and scoped to the caller's own activity. Refused
 *       once the activity has any volunteer application.
 *     tags:
 *       - Activities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Skill removed
 *       400:
 *         description: Required skills cannot be removed after a volunteer has joined this activity.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id/skills/:skillId",
  checkPermission("update_activity"),
  projectWriteRateLimit,
  activitiesController.removeSkill,
);

/**
 * @openapi
 * /v1/activities/{id}/approve:
 *   post:
 *     summary: Publish an activity (Admin review)
 *     description: >
 *       Admin-only. Moves `pending_review` to `published` and records the
 *       reviewer as approved_by. An Organization holding update_activity can
 *       never publish its own activity because it lacks approve_activity.
 *       The optional `note` is stored as `review_note` and returned to the
 *       Organization.
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Stored as review_note on the activity
 *     responses:
 *       200:
 *         description: Activity published, with review_note set
 *       400:
 *         description: Activity has already been reviewed
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/approve",
  checkPermission("approve_activity"),
  reviewDecisionRateLimit,
  activitiesController.approve,
);

/**
 * @openapi
 * /v1/activities/{id}/reject:
 *   post:
 *     summary: Reject an activity (Admin review)
 *     description: >
 *       Admin-only. Moves `pending_review` to `rejected` and records the
 *       reviewer as approved_by. The optional `note` is stored as
 *       `review_note` so the Organization can see why it was rejected.
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Stored as review_note on the activity
 *     responses:
 *       200:
 *         description: Activity rejected, with review_note set
 *       400:
 *         description: Activity has already been reviewed
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/reject",
  checkPermission("approve_activity"),
  reviewDecisionRateLimit,
  activitiesController.reject,
);

export default router;
