import { Router } from "express";
import { domainController } from "./domains.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import {
  createDomainSchema,
  updateDomainSchema,
  listDomainsSchema,
  assignSkillSchema,
  createSubDomainSchema,
  updateSubDomainSchema,
  listSubDomainsSchema,
} from "./domains.validator.js";
import { domainRateLimit } from "../../../framework/middleware/rateLimiter.js";

const router = Router();

/**
 * @openapi
 * /v1/domains:
 *   get:
 *     summary: List all domains
 *     description: Retrieve a paginated list of domains.
 *     tags:
 *       - Domains
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/", domainRateLimit, zodValidateQuery(listDomainsSchema), domainController.getAll);

/**
 * @openapi
 * /v1/domains/reviewers:
 *   get:
 *     summary: List all domain reviewers
 *     description: Retrieve all users eligible to be reviewers across domains. Requires manage_users permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reviewers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/reviewers",
  verifyAccessToken,
  checkPermission("manage_users"),
  domainRateLimit,
  domainController.getAllReviewers,
);

// ── Sub-Domains CRUD ──────────────────────────────────────────

/**
 * @openapi
 * /v1/domains/sub-domains:
 *   get:
 *     summary: List sub-domains
 *     description: Retrieve a paginated list of sub-domains with optional filtering by parent domain_id.
 *     tags:
 *       - Domains
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: domain_id
 *         schema:
 *           type: integer
 *         description: Optional parent domain ID to filter by
 *         example: 1
 *     responses:
 *       200:
 *         description: Sub-domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/sub-domains",
  domainRateLimit,
  zodValidateQuery(listSubDomainsSchema),
  domainController.getAllSubDomains,
);

/**
 * @openapi
 * /v1/domains/sub-domains/{id}:
 *   get:
 *     summary: Get sub-domain by ID
 *     description: Retrieve details of a specific sub-domain including its parent domain. Requires view_domains permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-domain ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Sub-domain fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  "/sub-domains/:id",
  verifyAccessToken,
  checkPermission("view_domains"),
  domainRateLimit,
  domainController.getSubDomainById,
);

/**
 * @openapi
 * /v1/domains/sub-domains:
 *   post:
 *     summary: Create a sub-domain
 *     description: Create a new sub-domain linked to an existing parent domain. Requires create_domain permission.
 *     tags:
 *       - Domains
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
 *               - domain_id
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Backend Development
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Server-side architecture, APIs, and microservices
 *               domain_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Sub-domain created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not Found - Parent domain does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - Sub-domain name already exists in this domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/sub-domains",
  verifyAccessToken,
  checkPermission("create_domain"),
  domainRateLimit,
  zodValidate(createSubDomainSchema),
  domainController.createSubDomain,
);

/**
 * @openapi
 * /v1/domains/sub-domains/{id}:
 *   patch:
 *     summary: Update a sub-domain
 *     description: Update a sub-domain's name, description, or parent domain. Requires update_domain permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-domain ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Backend & Cloud APIs
 *               description:
 *                 type: string
 *                 example: Updated sub-domain description
 *               domain_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Sub-domain updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  "/sub-domains/:id",
  verifyAccessToken,
  checkPermission("update_domain"),
  domainRateLimit,
  zodValidate(updateSubDomainSchema),
  domainController.updateSubDomain,
);

/**
 * @openapi
 * /v1/domains/sub-domains/{id}:
 *   delete:
 *     summary: Delete a sub-domain
 *     description: Delete a sub-domain by ID. Blocked if any projects are currently linked to this sub-domain. Requires delete_domain permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-domain ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Sub-domain deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflict - Sub-domain contains linked projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/sub-domains/:id",
  verifyAccessToken,
  checkPermission("delete_domain"),
  domainRateLimit,
  domainController.removeSubDomain,
);

/**
 * @openapi
 * /v1/domains/{id}:
 *   get:
 *     summary: Get domain by ID
 *     description: Retrieve details of a specific domain by its ID. Requires view_domains permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Domain ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Domain fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  "/:id",
  verifyAccessToken,
  checkPermission("view_domains"),
  domainRateLimit,
  domainController.getById,
);

/**
 * @openapi
 * /v1/domains:
 *   post:
 *     summary: Create a domain
 *     description: Create a new business or technical domain. Requires create_domain permission.
 *     tags:
 *       - Domains
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
 *                 maxLength: 100
 *                 example: Cloud Computing & DevOps
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Cloud infrastructure, CI/CD, Kubernetes, and container orchestration
 *     responses:
 *       201:
 *         description: Domain created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  verifyAccessToken,
  checkPermission("create_domain"),
  domainRateLimit,
  zodValidate(createDomainSchema),
  domainController.create,
);

/**
 * @openapi
 * /v1/domains/{id}:
 *   patch:
 *     summary: Update a domain
 *     description: Update a domain's name or description. Requires update_domain permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Domain ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cloud & Platform Engineering
 *               description:
 *                 type: string
 *                 example: Updated domain scope
 *     responses:
 *       200:
 *         description: Domain updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  verifyAccessToken,
  checkPermission("update_domain"),
  domainRateLimit,
  zodValidate(updateDomainSchema),
  domainController.update,
);

/**
 * @openapi
 * /v1/domains/{id}:
 *   delete:
 *     summary: Delete a domain
 *     description: Delete a domain by ID. Requires delete_domain permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Domain ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Domain deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  verifyAccessToken,
  checkPermission("delete_domain"),
  domainRateLimit,
  domainController.remove,
);

// ── Domain ↔ Skills ───────────────────────────────────────────

/**
 * @openapi
 * /v1/domains/{id}/skills:
 *   get:
 *     summary: Get skills linked to a domain
 *     description: Retrieve all skills associated with the specified domain. Requires view_domains permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Domain ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Skills fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  "/:id/skills",
  verifyAccessToken,
  checkPermission("view_domains"),
  domainRateLimit,
  domainController.getSkillsByDomainId,
);

/**
 * @openapi
 * /v1/domains/{id}/skills:
 *   post:
 *     summary: Link skills to a domain
 *     description: Associate one or multiple skill IDs with a domain. Requires update_domain permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Domain ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skill_id:
 *                 type: integer
 *                 example: 10
 *               skill_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [10, 11, 12]
 *     responses:
 *       200:
 *         description: Skills linked to domain successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  "/:id/skills",
  verifyAccessToken,
  checkPermission("update_domain"),
  domainRateLimit,
  zodValidate(assignSkillSchema),
  domainController.addSkillsToDomain,
);

// ── Domain ↔ Reviewers ────────────────────────────────────────

/**
 * @openapi
 * /v1/domains/{id}/reviewers:
 *   get:
 *     summary: Get reviewers linked to a domain
 *     description: Retrieve all reviewers currently assigned to evaluate candidates in this domain. Requires manage_users permission.
 *     tags:
 *       - Domains
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Domain ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Domain reviewers fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
  "/:id/reviewers",
  verifyAccessToken,
  checkPermission("manage_users"),
  domainRateLimit,
  domainController.getReviewersByDomainId,
);

export default router;
