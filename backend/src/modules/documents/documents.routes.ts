import { Router } from "express";
import { documentController } from "./documents.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { upload } from "../../../framework/middleware/upload.js";
import { uploadErrorHandler } from "../../../framework/middleware/uploadErrorHandler.js";
import { uploadDocumentSchema, listDocumentsSchema } from "./documents.validator.js";
import {
  documentReadRateLimit,
  documentWriteRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

router.use(verifyAccessToken);

router.get(
  "/",
  documentReadRateLimit,
  zodValidateQuery(listDocumentsSchema),
  documentController.getAll,
);
router.get("/:id", documentReadRateLimit, documentController.getById);
router.post(
  "/upload",
  documentWriteRateLimit,
  upload.single("file"),
  uploadErrorHandler,
  zodValidate(uploadDocumentSchema),
  documentController.upload,
);
router.delete("/:id", documentWriteRateLimit, documentController.delete);

export default router;
