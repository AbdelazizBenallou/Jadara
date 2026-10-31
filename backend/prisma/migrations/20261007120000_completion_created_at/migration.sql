-- Completion records: add created_at to match the intended data model.
ALTER TABLE "user_completed_volunteering" ADD COLUMN "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;