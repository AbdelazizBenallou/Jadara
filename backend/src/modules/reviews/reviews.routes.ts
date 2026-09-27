import { Router } from "express";
import { reviewController } from "./reviews.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { ratingSchema, listReviewsSchema } from "./reviews.validator.js";
import {
  reviewReadRateLimit,
  reviewDecisionRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.use(verifyAccessToken, checkPermission("review_projects"));

router.get(
  "/available",
  reviewReadRateLimit,
  zodValidateQuery(listReviewsSchema),
  reviewController.getAvailable,
);
router.get(
  "/history",
  reviewReadRateLimit,
  zodValidateQuery(listReviewsSchema),
  reviewController.getHistory,
);
router.get("/domains", reviewReadRateLimit, reviewController.getMyDomains);
router.get("/:id", reviewReadRateLimit, reviewController.getById);
router.post(
  "/:projectId/rate",
  reviewDecisionRateLimit,
  zodValidate(ratingSchema),
  reviewController.rate,
);
router.put(
  "/:projectId/rate",
  reviewDecisionRateLimit,
  zodValidate(ratingSchema),
  reviewController.updateRating,
);

export default router;
