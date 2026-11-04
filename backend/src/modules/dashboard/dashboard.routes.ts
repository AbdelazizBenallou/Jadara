import { Router } from "express";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { dashboardController } from "./dashboard.controller.js";

const router = Router();

router.use(verifyAccessToken, checkPermission("manage_users"));

router.get("/summary", dashboardController.getSummary);

export default router;
