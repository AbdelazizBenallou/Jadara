import { Router } from "express";
import { roleController } from "./roles.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { roleRateLimit, permissionRateLimit } from "../../../framework/middleware/rateLimiter.js";
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionSchema,
} from "./roles.validator.js";

const router = Router();
const permissionRouter = Router();

/**
 * @openapi
 * /v1/roles:
 *   get:
 *     summary: List all roles
 *     description: >
 *       Returns every role. `is_selectable` is true only for roles that can be
 *       registered directly; Reviewer, Company and Organization must go through
 *       POST /v1/registration-demands. Public endpoint, no authentication needed.
 *     tags:
 *       - Roles
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Beneficiary
 *                       is_selectable:
 *                         type: boolean
 *                         example: true
 */
router.get("/", roleController.findAll);

// ── Admin-only routes ─────────────────────────────────────────
router.use(verifyAccessToken, checkPermission("manage_roles"), roleRateLimit);

router.get("/:id", roleController.findById);
router.post("/", zodValidate(createRoleSchema), roleController.create);
router.patch("/:id", zodValidate(updateRoleSchema), roleController.update);
router.delete("/:id", roleController.delete);

// ── Role ↔ Permissions ─────────────────────────────────────────
router.get("/:id/permissions", roleController.getPermissionsByRoleId);
router.post(
  "/:id/permissions",
  zodValidate(assignPermissionSchema),
  roleController.addPermissionToRole,
);
router.delete("/:id/permissions/:permissionId", roleController.removePermissionFromRole);

// ── Role → Users ──────────────────────────────────────────────
router.get("/:id/users", roleController.getUsersByRoleId);

// ── Permission routes ─────────────────────────────────────────
permissionRouter.use(verifyAccessToken, checkPermission("manage_roles"), permissionRateLimit);

permissionRouter.get("/", roleController.findAllPermissions);
permissionRouter.get("/:id", roleController.findPermissionById);
permissionRouter.post("/", zodValidate(createPermissionSchema), roleController.createPermission);
permissionRouter.patch(
  "/:id",
  zodValidate(updatePermissionSchema),
  roleController.updatePermission,
);
permissionRouter.delete("/:id", roleController.deletePermission);
permissionRouter.get("/:id/roles", roleController.getRolesByPermissionId);

export { router as roleRoutes, permissionRouter as permissionRoutes };
