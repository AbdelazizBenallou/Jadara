import { Router } from "express";
import { usersController } from "./users.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import {
  listUsersSchema,
  updateUserSchema,
  updateProfileSchema,
  addSocialSchema,
} from "./users.validator.js";

import { setReviewerDomainsSchema } from "../reviews/reviews.validator.js";
import { addUserSkillsSchema, updateSkillLevelSchema } from "./user-skills.validator.js";
import { userSkillsController } from "./user-skills.controller.js";
import {
  listUsersRateLimit,
  getUserRateLimit,
  updateUserRateLimit,
  deleteUserRateLimit,
  getMyProfileRateLimit,
  updateMyProfileRateLimit,
  userSkillsReadRateLimit,
  userSkillsWriteRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

import { avatarUpload } from "../../../framework/middleware/upload.js";

import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";

import cvRoutes from "./users-cv.routes.js";

import cvPdfRoutes from "../cv-pdf/cv-pdf.routes.js";

const router = Router();

// ─── /me/profile (GET includes socials, PATCH with avatar) ──
router.get("/me/profile", verifyAccessToken, getMyProfileRateLimit, usersController.getMyProfile);
router.patch(
  "/me/profile",
  verifyAccessToken,
  updateMyProfileRateLimit,
  avatarUpload.single("avatar"),
  uploadErrorHandler,
  zodValidate(updateProfileSchema),
  usersController.updateMyProfile,
);

// ─── /me/activity (login history + devices combined) ────────
router.get("/me/activity", verifyAccessToken, usersController.getMyActivity);

// ─── /me/socials (add/remove only, list is in profile) ──────
router.post(
  "/me/socials",
  verifyAccessToken,
  zodValidate(addSocialSchema),
  usersController.addMySocial,
);
router.delete("/me/socials/:socialId", verifyAccessToken, usersController.removeMySocial);

// ─── /me/skills (self-service, no admin permission) ──────────
router.get(
  "/me/skills",
  verifyAccessToken,
  userSkillsReadRateLimit,
  userSkillsController.getSkills,
);
router.post(
  "/me/skills",
  verifyAccessToken,
  userSkillsWriteRateLimit,
  zodValidate(addUserSkillsSchema),
  userSkillsController.addSkills,
);
router.patch(
  "/me/skills/:skillId",
  verifyAccessToken,
  userSkillsWriteRateLimit,
  zodValidate(updateSkillLevelSchema),
  userSkillsController.updateSkill,
);
router.delete(
  "/me/skills/:skillId",
  verifyAccessToken,
  userSkillsWriteRateLimit,
  userSkillsController.removeSkill,
);

// ─── /me/* CV routes (work experience, education, certs, languages)
router.use("/me", cvRoutes);

// ─── /me/* CV PDF routes (generate, status, history)
router.use("/me", cvPdfRoutes);

// ─── /:id/profile (any authenticated user can view) ────────
router.get("/:id/profile", verifyAccessToken, getUserRateLimit, usersController.getPublicProfile);

// ─── Admin-only routes ───────────────────────────────────────
router.use(verifyAccessToken, checkPermission("manage_users"));

router.get("/", listUsersRateLimit, zodValidateQuery(listUsersSchema), usersController.getAll);
router.get("/:id", getUserRateLimit, usersController.getById);
router.patch("/:id", updateUserRateLimit, zodValidate(updateUserSchema), usersController.update);
router.delete("/:id", deleteUserRateLimit, usersController.remove);

// ─── Admin: manage any user's skills ─────────────────────────
router.get("/:id/skills", userSkillsReadRateLimit, userSkillsController.getUserSkills);
router.post(
  "/:id/skills",
  userSkillsWriteRateLimit,
  zodValidate(addUserSkillsSchema),
  userSkillsController.addUserSkills,
);
router.patch(
  "/:id/skills/:skillId",
  userSkillsWriteRateLimit,
  zodValidate(updateSkillLevelSchema),
  userSkillsController.updateUserSkill,
);
router.delete(
  "/:id/skills/:skillId",
  userSkillsWriteRateLimit,
  userSkillsController.removeUserSkill,
);

// ─── Admin: reviewer domain assignment ───────────────────────
router.get("/:id/review-domains", userSkillsReadRateLimit, usersController.getReviewerDomains);
router.put(
  "/:id/review-domains",
  userSkillsWriteRateLimit,
  zodValidate(setReviewerDomainsSchema),
  usersController.setReviewerDomains,
);
router.delete(
  "/:id/review-domains/:domainId",
  userSkillsWriteRateLimit,
  usersController.removeReviewerDomain,
);

export default router;
