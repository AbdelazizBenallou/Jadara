import { Router } from "express";
import { projectController } from "./projects.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { upload } from "../../../framework/middleware/upload.js";
import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
} from "./projects.validator.js";
import {
  projectReadRateLimit,
  projectWriteRateLimit,
  projectEvidenceRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.use(verifyAccessToken);

// ─── User self-service routes ──────────────────────────────
router.get(
  "/all",
  projectReadRateLimit,
  checkPermission("manage_projects"),
  projectController.getAllAdmin,
);
router.get(
  "/",
  projectReadRateLimit,
  zodValidateQuery(listProjectsSchema),
  projectController.getAll,
);
router.get("/:id", projectReadRateLimit, projectController.getById);
router.post("/", projectWriteRateLimit, zodValidate(createProjectSchema), projectController.create);
router.patch(
  "/:id",
  projectWriteRateLimit,
  zodValidate(updateProjectSchema),
  projectController.update,
);
router.delete("/:id", projectWriteRateLimit, projectController.delete);
router.post("/:id/submit", projectWriteRateLimit, projectController.submit);

// ─── Evidence routes ───────────────────────────────────────
router.post(
  "/:id/evidence",
  projectEvidenceRateLimit,
  upload.single("file"),
  uploadErrorHandler,
  projectController.uploadEvidence,
);
router.post("/:id/evidence/link", projectEvidenceRateLimit, projectController.linkEvidence);
router.delete(
  "/:id/evidence/:evidenceId",
  projectEvidenceRateLimit,
  projectController.removeEvidence,
);

// ─── Admin-only routes ─────────────────────────────────────
router.get(
  "/user/:userId",
  projectReadRateLimit,
  checkPermission("manage_projects"),
  projectController.getByUserId,
);
router.get(
  "/:id/admin",
  projectReadRateLimit,
  checkPermission("manage_projects"),
  projectController.getByIdAdmin,
);
router.delete(
  "/:id/admin",
  projectWriteRateLimit,
  checkPermission("manage_projects"),
  projectController.deleteAdmin,
);
router.patch(
  "/:id/status",
  projectWriteRateLimit,
  checkPermission("manage_projects"),
  projectController.forceStatus,
);

export default router;
