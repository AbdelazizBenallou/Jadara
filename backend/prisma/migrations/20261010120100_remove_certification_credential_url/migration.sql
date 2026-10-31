-- AlterTable: drop the external credential link from certifications (file_url is kept)
ALTER TABLE "certifications" DROP COLUMN "credential_url";
