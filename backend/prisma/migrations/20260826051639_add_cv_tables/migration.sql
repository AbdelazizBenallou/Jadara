-- CreateEnum
CREATE TYPE "LanguageProficiency" AS ENUM ('native', 'fluent', 'advanced', 'intermediate', 'beginner');

-- CreateTable
CREATE TABLE "work_experience" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "job_title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "school" VARCHAR(255) NOT NULL,
    "degree" VARCHAR(255) NOT NULL,
    "field_of_study" VARCHAR(255),
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "issuer" VARCHAR(255),
    "issue_date" DATE,
    "expiry_date" DATE,
    "credential_url" VARCHAR(500),
    "file_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_languages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "language" VARCHAR(100) NOT NULL,
    "proficiency" "LanguageProficiency" NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_work_experience_user" ON "work_experience"("user_id");

-- CreateIndex
CREATE INDEX "idx_education_user" ON "education"("user_id");

-- CreateIndex
CREATE INDEX "idx_certifications_user" ON "certifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_languages_user" ON "user_languages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_languages_user_id_language_key" ON "user_languages"("user_id", "language");

-- AddForeignKey
ALTER TABLE "work_experience" ADD CONSTRAINT "work_experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
