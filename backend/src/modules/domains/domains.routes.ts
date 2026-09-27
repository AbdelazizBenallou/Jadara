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
} from "./domains.validator.js";
import { domainRateLimit } from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.get("/", domainRateLimit, zodValidateQuery(listDomainsSchema), domainController.getAll);
router.get(
  "/reviewers",
  verifyAccessToken,
  checkPermission("manage_users"),
  domainRateLimit,
  domainController.getAllReviewers,
);
router.get(
  "/:id",
  verifyAccessToken,
  checkPermission("view_domains"),
  domainRateLimit,
  domainController.getById,
);
router.post(
  "/",
  verifyAccessToken,
  checkPermission("create_domain"),
  domainRateLimit,
  zodValidate(createDomainSchema),
  domainController.create,
);
router.patch(
  "/:id",
  verifyAccessToken,
  checkPermission("update_domain"),
  domainRateLimit,
  zodValidate(updateDomainSchema),
  domainController.update,
);
router.delete(
  "/:id",
  verifyAccessToken,
  checkPermission("delete_domain"),
  domainRateLimit,
  domainController.remove,
);

// ── Domain ↔ Skills ───────────────────────────────────────────
router.get(
  "/:id/skills",
  verifyAccessToken,
  checkPermission("view_domains"),
  domainRateLimit,
  domainController.getSkillsByDomainId,
);
router.post(
  "/:id/skills",
  verifyAccessToken,
  checkPermission("update_domain"),
  domainRateLimit,
  zodValidate(assignSkillSchema),
  domainController.addSkillsToDomain,
);

// ── Domain ↔ Reviewers ────────────────────────────────────────
router.get(
  "/:id/reviewers",
  verifyAccessToken,
  checkPermission("manage_users"),
  domainRateLimit,
  domainController.getReviewersByDomainId,
);

export default router;
