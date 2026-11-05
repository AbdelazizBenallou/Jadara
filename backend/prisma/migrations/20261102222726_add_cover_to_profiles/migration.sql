-- AlterTable
ALTER TABLE "cv_translations" ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "cover" VARCHAR(500);
