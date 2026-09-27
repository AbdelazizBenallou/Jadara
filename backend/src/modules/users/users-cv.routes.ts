import { Router } from "express";
import { cvController } from "./users-cv.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { cvReadRateLimit, cvWriteRateLimit } from "../../../framework/middleware/rateLimiter.js";
import { upload } from "../../../framework/middleware/upload.js";
import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";
import {
  createWorkExperienceSchema,
  updateWorkExperienceSchema,
  createEducationSchema,
  updateEducationSchema,
  createCertificationSchema,
  updateCertificationSchema,
  createLanguageSchema,
  updateLanguageSchema,
} from "./users-cv.validator.js";

const router = Router();
router.use(verifyAccessToken);

// ─── Work Experience ──────────────────────────────────────────
router.get("/work-experience", cvReadRateLimit, cvController.getWorkExperience);
router.post(
  "/work-experience",
  cvWriteRateLimit,
  zodValidate(createWorkExperienceSchema),
  cvController.createWorkExperience,
);
router.patch(
  "/work-experience/:id",
  cvWriteRateLimit,
  zodValidate(updateWorkExperienceSchema),
  cvController.updateWorkExperience,
);
router.delete("/work-experience/:id", cvWriteRateLimit, cvController.deleteWorkExperience);

// ─── Education ────────────────────────────────────────────────
router.get("/education", cvReadRateLimit, cvController.getEducation);
router.post(
  "/education",
  cvWriteRateLimit,
  zodValidate(createEducationSchema),
  cvController.createEducation,
);
router.patch(
  "/education/:id",
  cvWriteRateLimit,
  zodValidate(updateEducationSchema),
  cvController.updateEducation,
);
router.delete("/education/:id", cvWriteRateLimit, cvController.deleteEducation);

// ─── Certifications (with file upload) ────────────────────────
router.get("/certifications", cvReadRateLimit, cvController.getCertifications);
router.post(
  "/certifications",
  cvWriteRateLimit,
  upload.single("file"),
  uploadErrorHandler,
  zodValidate(createCertificationSchema),
  cvController.createCertification,
);
router.patch(
  "/certifications/:id",
  cvWriteRateLimit,
  upload.single("file"),
  uploadErrorHandler,
  zodValidate(updateCertificationSchema),
  cvController.updateCertification,
);
router.delete("/certifications/:id", cvWriteRateLimit, cvController.deleteCertification);

// ─── Languages ────────────────────────────────────────────────
router.get("/languages", cvReadRateLimit, cvController.getLanguages);
router.post(
  "/languages",
  cvWriteRateLimit,
  zodValidate(createLanguageSchema),
  cvController.createLanguage,
);
router.patch(
  "/languages/:id",
  cvWriteRateLimit,
  zodValidate(updateLanguageSchema),
  cvController.updateLanguage,
);
router.delete("/languages/:id", cvWriteRateLimit, cvController.deleteLanguage);

export default router;
