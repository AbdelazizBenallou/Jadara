import multer from "multer";
import { env } from "../config/env.js";

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
];

const AVATAR_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_AVATAR_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (AVATAR_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Avatar must be an image (JPEG, PNG, WebP)`));
    }
  },
});
