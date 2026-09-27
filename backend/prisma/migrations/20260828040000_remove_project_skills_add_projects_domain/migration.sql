-- Drop the join table linking projects to skills
DROP TABLE "project_skills";

-- Link projects to domains (one domain has many projects)
ALTER TABLE "projects" ADD COLUMN "domain_id" INTEGER;

-- Back-fill nothing (empty) — domain assignment via API going forward
ALTER TABLE "projects" ADD CONSTRAINT "projects_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX "idx_projects_domain" ON "projects"("domain_id");