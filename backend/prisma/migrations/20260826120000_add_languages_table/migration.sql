-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "idx_languages_name" ON "languages"("name");

-- DropIndex (unique index, not constraint)
DROP INDEX "user_languages_user_id_language_key";

-- DropColumn
ALTER TABLE "user_languages" DROP COLUMN "language";

-- AddColumn
ALTER TABLE "user_languages" ADD COLUMN "language_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateIndex
CREATE UNIQUE INDEX "user_languages_user_id_language_id_key" ON "user_languages"("user_id", "language_id");

-- CreateIndex
CREATE INDEX "idx_user_languages_language" ON "user_languages"("language_id");
