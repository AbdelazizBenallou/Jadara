-- Drop old verification system
DROP TABLE "verification_decisions";
DROP TABLE "verification_requests";

-- Rebuild ProjectStatus enum without 'rejected'
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'submitted', 'under_review', 'verified');
ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "status" TYPE "ProjectStatus" USING ("status"::text::"ProjectStatus");
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'draft';
DROP TYPE "ProjectStatus_old";

-- Drop VerificationStatus enum
DROP TYPE "VerificationStatus";

-- Project reviews (ratings 1-10)
CREATE TABLE "project_reviews" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_reviews_project_id_reviewer_id_key" ON "project_reviews"("project_id", "reviewer_id");
CREATE INDEX "idx_project_reviews_project" ON "project_reviews"("project_id");
CREATE INDEX "idx_project_reviews_reviewer" ON "project_reviews"("reviewer_id");

ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Reviewer domain assignments
CREATE TABLE "reviewer_domains" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviewer_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reviewer_domains_user_id_domain_id_key" ON "reviewer_domains"("user_id", "domain_id");
CREATE INDEX "idx_reviewer_domains_user" ON "reviewer_domains"("user_id");
CREATE INDEX "idx_reviewer_domains_domain" ON "reviewer_domains"("domain_id");

ALTER TABLE "reviewer_domains" ADD CONSTRAINT "reviewer_domains_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "reviewer_domains" ADD CONSTRAINT "reviewer_domains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE NO ACTION;