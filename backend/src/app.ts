import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import specs from "../framework/config/swagger.js";
import { env } from "../framework/config/env.js";
import { errorHandler } from "../framework/middleware/errorHandler.js";
import { notFound } from "../framework/middleware/notFound.js";
import { originCheck } from "../framework/middleware/originCheck.js";
import { requestId } from "../framework/middleware/requestId.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import { roleRoutes, permissionRoutes } from "./modules/roles/roles.routes.js";
import domainRoutes from "./modules/domains/domains.routes.js";
import skillRoutes from "./modules/skills/skills.routes.js";
import languageRoutes from "./modules/languages/languages.routes.js";
import documentRoutes from "./modules/documents/documents.routes.js";
import projectRoutes from "./modules/projects/projects.routes.js";
import reviewRoutes from "./modules/reviews/reviews.routes.js";
import demandRoutes from "./modules/demands/demands.routes.js";
import prisma from "../framework/config/prisma.js";
import { storage } from "../framework/utils/storage.js";

const app = express();

// Trust proxy in production
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// HTTPS redirect in production
app.use((req, res, next) => {
  if (
    env.NODE_ENV === "production" &&
    !req.secure &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }
  next();
});

// Request ID (first middleware)
app.use(requestId);

// Security headers
app.use(helmet());

// Core middleware
const corsOrigins =
  env.CORS_ORIGINS === "*" ? true : env.CORS_ORIGINS.split(",").map((s) => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// CSRF / origin validation for state-changing requests
app.use(originCheck);

// Swagger docs
if (env.SWAGGER_ENABLED) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.get("/api-json", (_req, res) => res.json(specs));
}

// Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/roles", roleRoutes);
app.use("/v1/permissions", permissionRoutes);
app.use("/v1/domains", domainRoutes);
app.use("/v1/skills", skillRoutes);
app.use("/v1/languages", languageRoutes);
app.use("/v1/documents", documentRoutes);
app.use("/v1/projects", projectRoutes);
app.use("/v1/reviews", reviewRoutes);
app.use("/v1/demands", demandRoutes);

// Health check (actually checks DB connectivity)
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
