-- Registration demands (reviewer / company pending approvals)

CREATE TYPE "DemandStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "demands" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "status" "DemandStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "review_note" VARCHAR(1000),
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demands_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_demands_user" ON "demands"("user_id");
CREATE INDEX "idx_demands_role" ON "demands"("role_id");
CREATE INDEX "idx_demands_status" ON "demands"("status");

ALTER TABLE "demands" ADD CONSTRAINT "demands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "demands" ADD CONSTRAINT "demands_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "demands" ADD CONSTRAINT "demands_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Requested domains per demand (reviewers)
CREATE TABLE "demand_domains" (
    "id" SERIAL NOT NULL,
    "demand_id" INTEGER NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "demand_domains_demand_id_domain_id_key" ON "demand_domains"("demand_id", "domain_id");
CREATE INDEX "idx_demand_domains_demand" ON "demand_domains"("demand_id");
CREATE INDEX "idx_demand_domains_domain" ON "demand_domains"("domain_id");

ALTER TABLE "demand_domains" ADD CONSTRAINT "demand_domains_demand_id_fkey" FOREIGN KEY ("demand_id") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "demand_domains" ADD CONSTRAINT "demand_domains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Link demand documents (uploaded proof files)
ALTER TABLE "documents" ADD COLUMN "demand_id" INTEGER;
CREATE INDEX "idx_documents_demand" ON "documents"("demand_id");
ALTER TABLE "documents" ADD CONSTRAINT "documents_demand_id_fkey" FOREIGN KEY ("demand_id") REFERENCES "demands"("id") ON DELETE SET NULL ON UPDATE NO ACTION;