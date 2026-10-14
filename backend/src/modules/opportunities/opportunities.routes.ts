import { Router } from "express";
import { opportunityController } from "./opportunities.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import {
  createOpportunityDraftSchema,
  listOpportunitiesQuerySchema,
  updateOpportunitySchema,
  browsePublishedQuerySchema,
  listMyRegistrationsQuerySchema,
  listOpportunityRegistrantsQuerySchema,
} from "./opportunities.validator.js";
import {
  getUserRateLimit,
  updateUserRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

// All opportunity management endpoints require an authenticated, active account
router.use(verifyAccessToken);

/**
 * @openapi
 * /v1/opportunities:
 *   post:
 *     summary: Create an Opportunity draft
 *     description: >
 *       Creates an opportunity in 'draft' status owned by the authenticated company.
 *       Requires create_opportunity permission. Only 'title' is mandatory in draft state.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Full-Stack Engineering Internship
 *               description:
 *                 type: string
 *                 example: Developing modern web applications with Node.js and React.
 *               type:
 *                 type: string
 *                 enum: [job, internship, project_freelance]
 *                 example: internship
 *               domain_id:
 *                 type: integer
 *                 example: 1
 *               sub_domain_id:
 *                 type: integer
 *                 example: 2
 *               registration_deadline:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-11-30T23:59:59Z
 *               required_skill_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 4, 7]
 *     responses:
 *       201:
 *         description: Opportunity draft created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  checkPermission("create_opportunity"),
  updateUserRateLimit,
  zodValidate(createOpportunityDraftSchema),
  opportunityController.createDraft,
);

/**
 * @openapi
 * /v1/opportunities/published:
 *   get:
 *     summary: Browse published opportunities
 *     description: >
 *       Returns a paginated list of all published opportunities visible to any authenticated user.
 *       Status is always 'published'; callers cannot filter by other statuses.
 *       Each row includes a `registration_open` flag indicating whether a beneficiary can
 *       register right now: true when the registration deadline is strictly in the future
 *       AND the owning company is not removed. Opportunities with registration unavailable
 *       are still returned — they are not hidden.
 *       Optionally filters by domain_id, opportunity type, and title keyword (case-insensitive).
 *       Requires browse_opportunities permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: domain_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [job, internship, project_freelance]
 *       - in: query
 *         name: q
 *         description: Case-insensitive keyword search on opportunity title (max 100 characters)
 *         schema:
 *           type: string
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Opportunities fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/published",
  checkPermission("browse_opportunities"),
  getUserRateLimit,
  zodValidateQuery(browsePublishedQuerySchema),
  opportunityController.browse,
);

/**
 * @openapi
 * /v1/opportunities/published/{id}/register:
 *   post:
 *     summary: Register for a published opportunity
 *     description: >
 *       Registers the authenticated Beneficiary for a published opportunity.
 *       The beneficiary identity is always resolved from the access token;
 *       the client cannot supply a beneficiary_id.
 *       Requires all of the following conditions to be true at registration time:
 *       - The opportunity exists and has status 'published'.
 *       - The owning Company has not been removed.
 *       - The registration deadline is set and has not passed.
 *       - The Beneficiary has at least one verified project.
 *       Returns 409 if the Beneficiary has already registered for this opportunity.
 *       Requires register_opportunity permission (Beneficiary role only).
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Successfully registered for the opportunity
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  "/published/:id/register",
  checkPermission("register_opportunity"),
  updateUserRateLimit,
  opportunityController.register,
);

/**
 * @openapi
 * /v1/opportunities/registrations/mine:
 *   get:
 *     summary: List the authenticated beneficiary's own registrations
 *     description: >
 *       Returns a paginated list of the calling Beneficiary's opportunity registrations,
 *       ordered newest-first. Both published and closed opportunities are included so
 *       historical registrations remain visible after closure. The beneficiary identity
 *       is derived exclusively from the access token; the client cannot request another
 *       user's registrations. No beneficiary PII or company-private data is exposed.
 *       Requires view_own_registrations permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Registrations fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/registrations/mine",
  checkPermission("view_own_registrations"),
  getUserRateLimit,
  zodValidateQuery(listMyRegistrationsQuerySchema),
  opportunityController.listMyRegistrations,
);

/**
 * @openapi
 * /v1/opportunities/mine:
 *   get:
 *     summary: List authenticated company's opportunities
 *     description: >
 *       Returns opportunities owned strictly by the caller's company.
 *       Requires view_own_opportunities permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, closed]
 *     responses:
 *       200:
 *         description: Opportunities fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/mine",
  checkPermission("view_own_opportunities"),
  getUserRateLimit,
  zodValidateQuery(listOpportunitiesQuerySchema),
  opportunityController.listMine,
);

/**
 * @openapi
 * /v1/opportunities/mine/{id}:
 *   get:
 *     summary: Retrieve an owned opportunity by ID
 *     description: >
 *       Returns the details of an opportunity owned by the caller's company.
 *       Returns 404 if not found or not owned by the company.
 *       Requires view_own_opportunities permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Opportunity fetched successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/mine/:id",
  checkPermission("view_own_opportunities"),
  getUserRateLimit,
  opportunityController.getMineById,
);

/**
 * @openapi
 * /v1/opportunities/{id}/publish:
 *   post:
 *     summary: Publish an Opportunity draft
 *     description: >
 *       Transitions a draft opportunity to 'published' status.
 *       All seven required attributes must be populated on the persisted record:
 *       title, description, type, domain_id, sub_domain_id, at least one required skill,
 *       and a registration_deadline strictly in the future.
 *       Returns 409 Conflict if the opportunity is not in 'draft' state.
 *       Returns 400 if any required attribute is missing or invalid.
 *       Requires publish_opportunity permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Opportunity published successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  "/:id/publish",
  checkPermission("publish_opportunity"),
  updateUserRateLimit,
  opportunityController.publish,
);

/**
 * @openapi
 * /v1/opportunities/{id}/close:
 *   post:
 *     summary: Close an Opportunity
 *     description: >
 *       Transitions an opportunity owned by the caller's company to 'closed' status.
 *       Both 'draft' and 'published' opportunities may be closed directly.
 *       Returns 409 Conflict if the opportunity is already 'closed'.
 *       Closing preserves all existing registrations and historical records unchanged.
 *       No deadline rule applies to closing.
 *       Requires close_opportunity permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Opportunity closed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  "/:id/close",
  checkPermission("close_opportunity"),
  updateUserRateLimit,
  opportunityController.close,
);

/**
 * @openapi
 * /v1/opportunities/{id}:
 *   patch:
 *     summary: Update an owned Opportunity
 *     description: >
 *       Updates an existing opportunity owned strictly by the authenticated Company.
 *       Supports partial updates. When registrations exist (including anonymous),
 *       fields 'type', 'domain_id', 'sub_domain_id', and 'required_skill_ids' are frozen.
 *       Rejects updates to 'closed' opportunities with 409 Conflict.
 *       Requires update_opportunity permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [job, internship, project_freelance]
 *                 nullable: true
 *               domain_id:
 *                 type: integer
 *                 nullable: true
 *               sub_domain_id:
 *                 type: integer
 *                 nullable: true
 *               registration_deadline:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               required_skill_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Opportunity updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/:id",
  checkPermission("update_opportunity"),
  updateUserRateLimit,
  zodValidate(updateOpportunitySchema),
  opportunityController.update,
);

/**
 * @openapi
 * /v1/opportunities/{id}:
 *   delete:
 *     summary: Delete an Opportunity draft
 *     description: >
 *       Permanently deletes an opportunity draft owned by the caller's company.
 *       Permitted only when status is 'draft'. Returns 409 Conflict if published or closed.
 *       Requires delete_opportunity permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Opportunity draft deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.delete(
  "/:id",
  checkPermission("delete_opportunity"),
  updateUserRateLimit,
  opportunityController.deleteDraft,
);

/**
 * @openapi
 * /v1/opportunities/{id}/registrants:
 *   get:
 *     summary: List registrants for an owned opportunity
 *     description: >
 *       Returns a paginated list of non-anonymous beneficiaries who have registered
 *       for the specified opportunity. The opportunity must be owned by the calling
 *       Company; requests for another Company's opportunity return 404.
 *       Anonymous registrations (beneficiary_id = null) are excluded from this list
 *       but are preserved in the database.
 *       Historical registrations for closed or deadline-expired opportunities are included.
 *       Beneficiary information is limited to: id, first_name, last_name.
 *       Full profile and skill data belongs to Talent Discovery (search_talent).
 *       Requires view_opportunity_registrations permission.
 *     tags:
 *       - Opportunities
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Registrants fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/:id/registrants",
  checkPermission("view_opportunity_registrations"),
  getUserRateLimit,
  zodValidateQuery(listOpportunityRegistrantsQuerySchema),
  opportunityController.listOpportunityRegistrants,
);

export default router;
