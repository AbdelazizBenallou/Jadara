/*
  Warnings:

  - The `level` column on the `user_skills` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- AlterTable
ALTER TABLE "user_skills" DROP COLUMN "level",
ADD COLUMN     "level" "SkillLevel" NOT NULL DEFAULT 'beginner';
