-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "is_selectable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_socials" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_socials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_socials_user" ON "user_socials"("user_id");

-- AddForeignKey
ALTER TABLE "user_socials" ADD CONSTRAINT "user_socials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
