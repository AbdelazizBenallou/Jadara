import app from "./app.js";
import { env } from "../framework/config/env.js";
import prisma from "../framework/config/prisma.js";
import logger from "../framework/config/logger.js";
import { storage } from "../framework/utils/storage.js";
import { startCvWorker, stopCvWorker } from "./modules/cv-pdf/cv-pdf.worker.js";

const server = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("PostgreSQL connected");

    // Ensure MinIO buckets exist
    await storage.ensureBuckets();
    logger.info("MinIO buckets ensured");

    app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
    });

    startCvWorker();
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

const shutdown = async (): Promise<void> => {
  logger.info("Shutting down...");
  stopCvWorker();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});

server();
