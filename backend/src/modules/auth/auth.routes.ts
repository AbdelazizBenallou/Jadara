import { Router } from "express";
import { authController } from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from "./auth.validator.js";
import { verifyRefreshToken } from "../../../framework/middleware/verifyRefreshToken.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { upload } from "../../../framework/middleware/upload.js";
import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";
import {
  registerRateLimit,
  loginRateLimit,
  changePasswordRateLimit,
  refreshTokenRateLimit,
  logoutRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.post(
  "/register",
  registerRateLimit,
  upload.array("files", 5),
  uploadErrorHandler,
  zodValidate(registerSchema),
  authController.register,
);
router.post("/login", loginRateLimit, zodValidate(loginSchema), authController.login);
router.post(
  "/refresh-token",
  refreshTokenRateLimit,
  zodValidate(refreshTokenSchema),
  verifyRefreshToken,
  authController.refreshToken,
);
router.post(
  "/change-password",
  changePasswordRateLimit,
  verifyAccessToken,
  zodValidate(changePasswordSchema),
  authController.changePassword,
);
router.post("/logout", logoutRateLimit, verifyAccessToken, authController.logout);

export default router;
