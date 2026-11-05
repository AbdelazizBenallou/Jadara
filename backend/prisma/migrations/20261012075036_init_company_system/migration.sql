-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('draft', 'published', 'closed');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('job', 'internship', 'project_freelance');

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "is_removed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "type" "OpportunityType",
    "domain_id" INTEGER,
    "sub_domain_id" INTEGER,
    "registration_deadline" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_required_skills" (
    "id" SERIAL NOT NULL,
    "opportunity_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,

    CONSTRAINT "opportunity_required_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_registrations" (
    "id" SERIAL NOT NULL,
    "opportunity_id" INTEGER NOT NULL,
    "beneficiary_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE INDEX "opportunities_company_id_idx" ON "opportunities"("company_id");

-- CreateIndex
CREATE INDEX "opportunities_domain_id_idx" ON "opportunities"("domain_id");

-- CreateIndex
CREATE INDEX "opportunities_sub_domain_id_idx" ON "opportunities"("sub_domain_id");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunity_required_skills_skill_id_idx" ON "opportunity_required_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_required_skills_opportunity_id_skill_id_key" ON "opportunity_required_skills"("opportunity_id", "skill_id");

-- CreateIndex
CREATE INDEX "opportunity_registrations_beneficiary_id_idx" ON "opportunity_registrations"("beneficiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_registrations_opportunity_id_beneficiary_id_key" ON "opportunity_registrations"("opportunity_id", "beneficiary_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_sub_domain_id_fkey" FOREIGN KEY ("sub_domain_id") REFERENCES "sub_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_required_skills" ADD CONSTRAINT "opportunity_required_skills_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_required_skills" ADD CONSTRAINT "opportunity_required_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_registrations" ADD CONSTRAINT "opportunity_registrations_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_registrations" ADD CONSTRAINT "opportunity_registrations_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
