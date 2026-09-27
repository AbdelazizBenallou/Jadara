import { Router } from "express";
import { languageController } from "./languages.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import {
  createLanguageSchema,
  updateLanguageSchema,
  listLanguagesSchema,
} from "./languages.validator.js";
import { skillRateLimit } from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  zodValidateQuery(listLanguagesSchema),
  languageController.getAll,
);
router.get(
  "/:id",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  languageController.getById,
);
router.post(
  "/",
  verifyAccessToken,
  checkPermission("create_skill"),
  skillRateLimit,
  zodValidate(createLanguageSchema),
  languageController.create,
);
router.patch(
  "/:id",
  verifyAccessToken,
  checkPermission("update_skill"),
  skillRateLimit,
  zodValidate(updateLanguageSchema),
  languageController.update,
);
router.delete(
  "/:id",
  verifyAccessToken,
  checkPermission("delete_skill"),
  skillRateLimit,
  languageController.remove,
);

export default router;
