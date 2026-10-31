-- AlterTable: cv_generation_requests becomes an async job queue + snapshot store
ALTER TABLE "cv_generation_requests"
    ADD COLUMN     "request_group" UUID,
    ADD COLUMN     "worker_id" VARCHAR(100),
    ADD COLUMN     "started_at" TIMESTAMP(6),
    ADD COLUMN     "finished_at" TIMESTAMP(6),
    ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN     "section_hashes" JSONB,
    ADD COLUMN     "template_version" VARCHAR(20),
    ADD COLUMN     "source_lang" VARCHAR(10),
    ADD COLUMN     "cv_snapshot" JSONB,
    ALTER COLUMN "data_hash" TYPE VARCHAR(64);

-- CreateIndex
CREATE INDEX "cv_generation_requests_status_idx" ON "cv_generation_requests"("status");

-- AlterTable: cv_versions stores per-section hashes + template version
ALTER TABLE "cv_versions"
    ADD COLUMN     "data_hash" VARCHAR(64),
    ADD COLUMN     "section_hashes" JSONB,
    ADD COLUMN     "template_version" VARCHAR(20),
    ALTER COLUMN "last_audit_id" SET DEFAULT 0;

-- CreateTable: translation cache
CREATE TABLE "cv_translations" (
    "id" SERIAL NOT NULL,
    "source_hash" VARCHAR(64) NOT NULL,
    "source_lang" VARCHAR(10) NOT NULL,
    "target_lang" VARCHAR(10) NOT NULL,
    "source_text" TEXT,
    "translated_text" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'libretranslate',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cv_translations_source_hash_target_lang_key" ON "cv_translations"("source_hash", "target_lang");

-- CreateIndex
CREATE INDEX "cv_translations_target_lang_idx" ON "cv_translations"("target_lang");
