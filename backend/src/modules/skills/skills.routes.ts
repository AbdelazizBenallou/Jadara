import { Router } from "express";
import { skillController } from "./skills.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import {
  createSkillSchema,
  updateSkillSchema,
  listSkillsSchema,
  createSkillCategorySchema,
  listSkillCategoriesSchema,
} from "./skills.validator.js";
import { skillRateLimit } from "../../../framework/middleware/rateLimiter.js";

const router = Router();

// ── Categories ────────────────────────────────────────────────

/**
 * @openapi
 * /v1/skills/categories:
 *   get:
 *     summary: List skill categories
 *     description: Retrieve a paginated list of skill categories. Requires view_skills permission.
 *     tags:
 *       - Skill Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page (max 100)
 *         example: 10
 *     responses:
 *       200:
 *         description: Skill categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill categories fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SkillCategory'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/categories",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  zodValidateQuery(listSkillCategoriesSchema),
  skillController.getAllCategories,
);

/**
 * @openapi
 * /v1/skills/categories:
 *   post:
 *     summary: Create a skill category
 *     description: Create a new skill category with unique name and optional description. Requires create_skill permission.
 *     tags:
 *       - Skill Categories
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSkillCategoryInput'
 *           example:
 *             name: Software Engineering
 *             description: Skills related to software design, programming languages, and architecture
 *     responses:
 *       201:
 *         description: Skill category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/SkillCategory'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Conflict - Skill category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill category name already exists
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/categories",
  verifyAccessToken,
  checkPermission("create_skill"),
  skillRateLimit,
  zodValidate(createSkillCategorySchema),
  skillController.createCategory,
);

/**
 * @openapi
 * /v1/skills/categories/{id}:
 *   delete:
 *     summary: Delete a skill category
 *     description: Delete a skill category by ID. Cannot be deleted if linked to any skills. Requires delete_skill permission.
 *     tags:
 *       - Skill Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the skill category to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Skill category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill category deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       400:
 *         description: Bad Request - Invalid skill category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid skill category ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not Found - Skill category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill category not found
 *       409:
 *         description: Conflict - Category is linked to one or more skills
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Cannot delete skill category: linked to 3 skill(s). Unlink or reassign them first."
 */
router.delete(
  "/categories/:id",
  verifyAccessToken,
  checkPermission("delete_skill"),
  skillRateLimit,
  skillController.removeCategory,
);

// ── Skills ────────────────────────────────────────────────────

/**
 * @openapi
 * /v1/skills:
 *   get:
 *     summary: List all skills
 *     description: Retrieve a paginated list of skills along with their category. Requires view_skills permission.
 *     tags:
 *       - Skills
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page (max 100)
 *         example: 10
 *     responses:
 *       200:
 *         description: Skills fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skills fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Skill'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  zodValidateQuery(listSkillsSchema),
  skillController.getAll,
);

/**
 * @openapi
 * /v1/skills/{id}:
 *   get:
 *     summary: Get skill by ID
 *     description: Retrieve details of a specific skill by its unique ID. Requires view_skills permission.
 *     tags:
 *       - Skills
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the skill
 *         example: 10
 *     responses:
 *       200:
 *         description: Skill fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Bad Request - Invalid skill ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid skill ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not Found - Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill not found
 */
router.get(
  "/:id",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  skillController.getById,
);

/**
 * @openapi
 * /v1/skills:
 *   post:
 *     summary: Create a skill
 *     description: Create a new skill associated with an existing category. Requires create_skill permission.
 *     tags:
 *       - Skills
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSkillInput'
 *           example:
 *             name: TypeScript
 *             category_id: 1
 *             description: Strongly typed programming language that builds on JavaScript
 *             status: active
 *     responses:
 *       201:
 *         description: Skill created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Skill'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not Found - Skill category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill category not found
 *       409:
 *         description: Conflict - Skill name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill name already exists
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  verifyAccessToken,
  checkPermission("create_skill"),
  skillRateLimit,
  zodValidate(createSkillSchema),
  skillController.create,
);

/**
 * @openapi
 * /v1/skills/{id}:
 *   patch:
 *     summary: Update a skill
 *     description: Update skill fields such as name, category_id, description, or status. Requires update_skill permission.
 *     tags:
 *       - Skills
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the skill to update
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSkillInput'
 *           example:
 *             name: TypeScript 5.x
 *             category_id: 1
 *             description: Advanced TypeScript development and compiler options
 *             status: active
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Bad Request - Invalid skill ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid skill ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not Found - Skill or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill not found
 *       409:
 *         description: Conflict - Skill name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill name already exists
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/:id",
  verifyAccessToken,
  checkPermission("update_skill"),
  skillRateLimit,
  zodValidate(updateSkillSchema),
  skillController.update,
);

/**
 * @openapi
 * /v1/skills/{id}:
 *   delete:
 *     summary: Delete a skill
 *     description: Delete a skill by its ID. Cannot be deleted if linked to any user profiles or domains. Requires delete_skill permission.
 *     tags:
 *       - Skills
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the skill to delete
 *         example: 10
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Skill deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       400:
 *         description: Bad Request - Invalid skill ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid skill ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not Found - Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Skill not found
 *       409:
 *         description: Conflict - Skill is linked to users or domains
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Cannot delete skill: linked to 2 user(s), 1 domain(s). Unlink them first."
 */
router.delete(
  "/:id",
  verifyAccessToken,
  checkPermission("delete_skill"),
  skillRateLimit,
  skillController.remove,
);

export default router;
