-- Volunteering activity management (Organization role).
--
-- Creates the activity schema that already existed in prisma/schema.prisma but
-- was never applied to this database, plus documents.activity_id so an activity
-- can be linked to its mandatory authorization document.
--
-- Status mapping used by the API:
--   spec PENDING      -> pending_review  (initial status, Admin must review)
--   spec APPROVED     -> published
--   spec REJECTED     -> rejected

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('pending_review', 'published', 'rejected', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'completed');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "activity_id" INTEGER;

-- CreateTable
CREATE TABLE "activity_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteering_activities" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "approved_by" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255),
    "start_date" TIMESTAMP(6) NOT NULL,
    "end_date" TIMESTAMP(6) NOT NULL,
    "required_volunteers" INTEGER NOT NULL,
    "requirements" TEXT,
    "registration_deadline" TIMESTAMP(3),
    "status" "ActivityStatus" NOT NULL DEFAULT 'pending_review',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteering_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_required_skills" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_required_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_applications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "application_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_completed_volunteering" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_completed_volunteering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_categories_name_key" ON "activity_categories"("name");

-- CreateIndex
CREATE INDEX "volunteering_activities_organization_id_idx" ON "volunteering_activities"("organization_id");

-- CreateIndex
CREATE INDEX "volunteering_activities_category_id_idx" ON "volunteering_activities"("category_id");

-- CreateIndex
CREATE INDEX "volunteering_activities_approved_by_idx" ON "volunteering_activities"("approved_by");

-- CreateIndex
CREATE INDEX "volunteering_activities_status_idx" ON "volunteering_activities"("status");

-- CreateIndex
CREATE INDEX "activity_required_skills_activity_id_idx" ON "activity_required_skills"("activity_id");

-- CreateIndex
CREATE INDEX "activity_required_skills_skill_id_idx" ON "activity_required_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_required_skills_activity_id_skill_id_key" ON "activity_required_skills"("activity_id", "skill_id");

-- CreateIndex
CREATE INDEX "volunteer_applications_user_id_idx" ON "volunteer_applications"("user_id");

-- CreateIndex
CREATE INDEX "volunteer_applications_activity_id_idx" ON "volunteer_applications"("activity_id");

-- CreateIndex
CREATE INDEX "volunteer_applications_status_idx" ON "volunteer_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_applications_user_id_activity_id_key" ON "volunteer_applications"("user_id", "activity_id");

-- CreateIndex
CREATE INDEX "user_completed_volunteering_user_id_idx" ON "user_completed_volunteering"("user_id");

-- CreateIndex
CREATE INDEX "user_completed_volunteering_activity_id_idx" ON "user_completed_volunteering"("activity_id");

-- CreateIndex
CREATE INDEX "user_completed_volunteering_organization_id_idx" ON "user_completed_volunteering"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_completed_volunteering_user_id_activity_id_key" ON "user_completed_volunteering"("user_id", "activity_id");

-- CreateIndex
CREATE INDEX "idx_documents_activity" ON "documents"("activity_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "volunteering_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "volunteering_activities" ADD CONSTRAINT "volunteering_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteering_activities" ADD CONSTRAINT "volunteering_activities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "activity_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteering_activities" ADD CONSTRAINT "volunteering_activities_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_required_skills" ADD CONSTRAINT "activity_required_skills_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "volunteering_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_required_skills" ADD CONSTRAINT "activity_required_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "volunteering_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_completed_volunteering" ADD CONSTRAINT "user_completed_volunteering_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_completed_volunteering" ADD CONSTRAINT "user_completed_volunteering_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "volunteering_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_completed_volunteering" ADD CONSTRAINT "user_completed_volunteering_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
