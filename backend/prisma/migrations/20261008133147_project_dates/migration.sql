-- AlterTable
ALTER TABLE "cv_generation_requests" ALTER COLUMN "language" SET DEFAULT 'EN';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "end_date" DATE,
ADD COLUMN     "start_date" DATE;

-- CreateIndex
CREATE INDEX "idx_reviewer_domains_user" ON "reviewer_domains"("user_id");
