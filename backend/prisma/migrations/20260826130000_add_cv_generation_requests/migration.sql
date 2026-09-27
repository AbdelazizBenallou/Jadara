-- CreateTable
CREATE TABLE "cv_generation_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "missing_fields" JSONB,
    "data_hash" VARCHAR(64),
    "file_url" VARCHAR(500),
    "file_size" INTEGER,
    "error_message" VARCHAR(1000),
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "cv_generation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_cv_generation_requests_user" ON "cv_generation_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_cv_generation_requests_status" ON "cv_generation_requests"("status");

-- AddForeignKey
ALTER TABLE "cv_generation_requests" ADD CONSTRAINT "cv_generation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
