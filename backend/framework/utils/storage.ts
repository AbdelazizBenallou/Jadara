import { minioClient, BUCKETS, type BucketName } from "../config/minio.js";
import { env } from "../config/env.js";
import { v4 as uuid } from "uuid";
import path from "path";

const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export const storage = {
  async upload(bucket: BucketName, folder: string, file: Express.Multer.File, userId: number) {
    const ext = path.extname(file.originalname) || ".bin";
    const objectName = `${folder}/${userId}/${uuid()}${ext}`;

    await minioClient.putObject(bucket, objectName, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });

    return {
      objectName,
      fileUrl: objectName,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  },

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    const ext = path.extname(file.originalname) || ".bin";
    const objectName = `${userId}${ext}`;

    await minioClient.putObject(BUCKETS.avatars, objectName, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });

    return objectName;
  },

  async getPresignedUrl(bucket: BucketName, objectName: string): Promise<string> {
    return minioClient.presignedGetObject(bucket, objectName, PRESIGNED_URL_EXPIRY);
  },

  async delete(bucket: BucketName, objectName: string): Promise<void> {
    try {
      await minioClient.removeObject(bucket, objectName);
    } catch {
      // object may not exist — swallow
    }
  },

  async deleteAvatar(objectName: string): Promise<void> {
    await storage.delete(BUCKETS.avatars, objectName);
  },

  async uploadBuffer(
    bucket: BucketName,
    folder: string,
    userId: number,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ) {
    const ext = path.extname(fileName) || ".pdf";
    const objectName = `${folder}/${userId}/${uuid()}${ext}`;

    await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
      "Content-Type": mimeType,
    });

    return {
      objectName,
      fileSize: buffer.length,
      mimeType,
    };
  },

  async ensureBuckets(): Promise<void> {
    const buckets = Object.values(BUCKETS);
    for (const bucket of buckets) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
      }
    }
  },
};
