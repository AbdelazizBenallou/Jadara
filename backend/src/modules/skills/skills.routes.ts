import { Router } from "express";
import { skillController } from "./skills.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { createSkillSchema, updateSkillSchema, listSkillsSchema } from "./skills.validator.js";
import { skillRateLimit } from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  zodValidateQuery(listSkillsSchema),
  skillController.getAll,
);
router.get(
  "/:id",
  verifyAccessToken,
  checkPermission("view_skills"),
  skillRateLimit,
  skillController.getById,
);
router.post(
  "/",
  verifyAccessToken,
  checkPermission("create_skill"),
  skillRateLimit,
  zodValidate(createSkillSchema),
  skillController.create,
);
router.patch(
  "/:id",
  verifyAccessToken,
  checkPermission("update_skill"),
  skillRateLimit,
  zodValidate(updateSkillSchema),
  skillController.update,
);
router.delete(
  "/:id",
  verifyAccessToken,
  checkPermission("delete_skill"),
  skillRateLimit,
  skillController.remove,
);

export default router;
