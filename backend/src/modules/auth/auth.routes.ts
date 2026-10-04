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

/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user account with profile details and optional certification/identity files.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - role_id
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@jadara.dev
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               first_name:
 *                 type: string
 *                 example: Alex
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *                 example: Male
 *               role_id:
 *                 type: integer
 *                 example: 2
 *               domain_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 supporting documents or certificates
 *     responses:
 *       201:
 *         description: Registration successful or submitted for review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         email:
 *                           type: string
 *                           example: user@jadara.dev
 *                         first_name:
 *                           type: string
 *                           example: Alex
 *                         last_name:
 *                           type: string
 *                           example: Doe
 *                         role_id:
 *                           type: integer
 *                           example: 2
 *                     demand:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 12
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Conflict - Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email already registered
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/register",
  registerRateLimit,
  upload.array("files", 5),
  uploadErrorHandler,
  zodValidate(registerSchema),
  authController.register,
);

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     summary: Log in to user account
 *     description: Authenticate with email and password to receive HTTP-only cookies and user information.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@jadara.dev
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful. Sets accessToken and refreshToken cookies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: admin@jadara.dev
 *                         first_name:
 *                           type: string
 *                           example: System
 *                         last_name:
 *                           type: string
 *                           example: Admin
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/login", loginRateLimit, zodValidate(loginSchema), authController.login);

/**
 * @openapi
 * /v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token (from cookie or request body) for a new access token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional if provided via HTTP-only cookie
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/refresh-token",
  refreshTokenRateLimit,
  zodValidate(refreshTokenSchema),
  verifyRefreshToken,
  authController.refreshToken,
);

/**
 * @openapi
 * /v1/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Update the authenticated user's password. Clears existing session cookies.
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPassword456!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - Current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/change-password",
  changePasswordRateLimit,
  verifyAccessToken,
  zodValidate(changePasswordSchema),
  authController.changePassword,
);

/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     summary: Log out of current session
 *     description: Invalidate active refresh tokens and clear HTTP-only authentication cookies.
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/logout", logoutRateLimit, verifyAccessToken, authController.logout);

export default router;
