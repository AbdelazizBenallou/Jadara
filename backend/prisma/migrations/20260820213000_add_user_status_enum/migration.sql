-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'locked', 'pending');

-- AlterEnum: Convert status column from varchar to UserStatus enum
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus" USING "status"::"UserStatus";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';
