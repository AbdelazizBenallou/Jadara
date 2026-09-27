import { Router } from "express";
import { demandController } from "./demands.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { listDemandsSchema, reviewDemandSchema } from "./demands.validator.js";
import {
  listUsersRateLimit,
  getUserRateLimit,
  updateUserRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.use(verifyAccessToken, checkPermission("manage_users"));

router.get("/", listUsersRateLimit, zodValidateQuery(listDemandsSchema), demandController.getAll);
router.get("/:id", getUserRateLimit, demandController.getById);
router.post(
  "/:id/approve",
  updateUserRateLimit,
  zodValidate(reviewDemandSchema),
  demandController.approve,
);
router.post(
  "/:id/reject",
  updateUserRateLimit,
  zodValidate(reviewDemandSchema),
  demandController.reject,
);

export default router;
