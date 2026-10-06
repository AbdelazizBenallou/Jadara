-- Registration demand workflow: audit snapshots + notification bookkeeping.
--
-- `demands.user_id` becomes nullable and uses ON DELETE SET NULL so a rejected
-- demand survives deletion of its temporary user account (the row is kept for
-- history/audit). The applicant identity is snapshotted into the demand so the
-- record stays meaningful once the user row is gone.
--
-- `organizations` is created because an approved Organization demand must be
-- linked to the organization it owns (User -> Organization).

-- DropForeignKey
ALTER TABLE "demands" DROP CONSTRAINT "demands_user_id_fkey";

-- AlterTable
ALTER TABLE "demands" ADD COLUMN     "account_deleted_at" TIMESTAMP(6),
ADD COLUMN     "applicant_email" VARCHAR(255),
ADD COLUMN     "applicant_first_name" VARCHAR(100),
ADD COLUMN     "applicant_last_name" VARCHAR(100),
ADD COLUMN     "decision_notification_sent_at" TIMESTAMP(6),
ADD COLUMN     "details" JSONB,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "website" VARCHAR(500),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "location" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_user_id_idx" ON "organizations"("user_id");

-- CreateIndex
CREATE INDEX "idx_demands_applicant_email" ON "demands"("applicant_email");

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;