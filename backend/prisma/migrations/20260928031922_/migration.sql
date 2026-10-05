/*
  Warnings:

  - You are about to drop the column `domain_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `user_socials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `reviewer_domains` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,platform_id]` on the table `user_socials` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `action` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `language` to the `cv_generation_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `skills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_id` to the `user_socials` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "CVLanguage" AS ENUM ('AR', 'EN', 'FR');

-- DropForeignKey
ALTER TABLE "cv_generation_requests" DROP CONSTRAINT "cv_generation_requests_user_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_domain_id_fkey";

-- DropIndex
DROP INDEX "idx_cv_generation_requests_status";

-- DropIndex
DROP INDEX "idx_projects_domain";

-- DropIndex
DROP INDEX "idx_reviewer_domains_user";

-- DropIndex
DROP INDEX "reviewer_domains_user_id_domain_id_key";

-- DropIndex
DROP INDEX "user_socials_user_id_platform_key";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL;

-- AlterTable
ALTER TABLE "cv_generation_requests" ADD COLUMN     "language" "CVLanguage" NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "data_hash" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "error_message" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "domain_id",
ADD COLUMN     "sub_domain_id" INTEGER;

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user_socials" DROP COLUMN "platform",
ADD COLUMN     "platform_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "social_platforms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_domains" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "domain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_versions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "language" "CVLanguage" NOT NULL,
    "version" INTEGER NOT NULL,
    "last_audit_id" INTEGER NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_platforms_name_key" ON "social_platforms"("name");

-- CreateIndex
CREATE INDEX "idx_social_platforms_name" ON "social_platforms"("name");

-- CreateIndex
CREATE INDEX "idx_sub_domains_domain" ON "sub_domains"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_domains_domain_id_name_key" ON "sub_domains"("domain_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE INDEX "idx_skill_categories_name" ON "skill_categories"("name");

-- CreateIndex
CREATE INDEX "cv_versions_user_id_idx" ON "cv_versions"("user_id");

-- CreateIndex
CREATE INDEX "cv_versions_user_id_language_idx" ON "cv_versions"("user_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "cv_versions_user_id_language_version_key" ON "cv_versions"("user_id", "language", "version");

-- CreateIndex
CREATE INDEX "cv_generation_requests_user_id_language_idx" ON "cv_generation_requests"("user_id", "language");

-- CreateIndex
CREATE INDEX "idx_projects_sub_domain" ON "projects"("sub_domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_domains_user_id_key" ON "reviewer_domains"("user_id");

-- CreateIndex
CREATE INDEX "idx_skills_category" ON "skills"("category_id");

-- CreateIndex
CREATE INDEX "idx_user_socials_platform" ON "user_socials"("platform_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_socials_user_id_platform_id_key" ON "user_socials"("user_id", "platform_id");

-- AddForeignKey
ALTER TABLE "cv_generation_requests" ADD CONSTRAINT "cv_generation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_socials" ADD CONSTRAINT "user_socials_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "social_platforms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sub_domains" ADD CONSTRAINT "sub_domains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sub_domain_id_fkey" FOREIGN KEY ("sub_domain_id") REFERENCES "sub_domains"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_cv_generation_requests_user" RENAME TO "cv_generation_requests_user_id_idx";
