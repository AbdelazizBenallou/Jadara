/*
  Warnings:

  - A unique constraint covering the columns `[user_id,platform]` on the table `user_socials` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cv_generation_requests" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "languages" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "user_socials_user_id_platform_key" ON "user_socials"("user_id", "platform");
