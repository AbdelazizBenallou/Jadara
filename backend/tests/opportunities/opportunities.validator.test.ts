import { describe, it, expect } from "vitest";
import {
  createOpportunityDraftSchema,
  listOpportunitiesQuerySchema,
  updateOpportunitySchema,
} from "../../src/modules/opportunities/opportunities.validator.js";

describe("Opportunity Validator — Unit Tests", () => {
  describe("createOpportunityDraftSchema", () => {
    it("accepts a minimal valid draft payload with title only", () => {
      const payload = {
        title: "Frontend Developer Internship",
      };

      const result = createOpportunityDraftSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Frontend Developer Internship");
        expect(result.data.description).toBeUndefined();
        expect(result.data.type).toBeUndefined();
        expect(result.data.domain_id).toBeUndefined();
        expect(result.data.sub_domain_id).toBeUndefined();
        expect(result.data.registration_deadline).toBeUndefined();
        expect(result.data.required_skill_ids).toBeUndefined();
      }
    });

    it("accepts a full valid draft payload", () => {
      const payload = {
        title: "Senior Cloud Engineer",
        description: "Leading cloud infrastructure and DevOps pipelines.",
        type: "job",
        domain_id: 2,
        sub_domain_id: 5,
        registration_deadline: "2026-12-31T23:59:59.000Z",
        required_skill_ids: [1, 3, 5],
      };

      const result = createOpportunityDraftSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Senior Cloud Engineer");
        expect(result.data.description).toBe("Leading cloud infrastructure and DevOps pipelines.");
        expect(result.data.type).toBe("job");
        expect(result.data.domain_id).toBe(2);
        expect(result.data.sub_domain_id).toBe(5);
        expect(result.data.registration_deadline).toBeInstanceOf(Date);
        expect(result.data.required_skill_ids).toEqual([1, 3, 5]);
      }
    });

    it("accepts project_freelance opportunity type", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Logo & UI Design",
        type: "project_freelance",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("project_freelance");
      }
    });

    it("trims whitespace from title", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "   Software Engineer   ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Software Engineer");
      }
    });

    it("rejects missing title", () => {
      const result = createOpportunityDraftSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("rejects empty or whitespace-only title", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "   ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("rejects title exceeding 255 characters", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "A".repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toContain(
          "Title must not exceed 255 characters",
        );
      }
    });

    it("rejects description exceeding 5000 characters", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Valid Title",
        description: "D".repeat(5001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined();
      }
    });

    it("rejects invalid opportunity type", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Valid Title",
        type: "freelance_gig",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.type).toBeDefined();
      }
    });

    it("rejects non-integer or non-positive domain_id and sub_domain_id", () => {
      const res1 = createOpportunityDraftSchema.safeParse({
        title: "Valid Title",
        domain_id: -1,
      });
      expect(res1.success).toBe(false);

      const res2 = createOpportunityDraftSchema.safeParse({
        title: "Valid Title",
        sub_domain_id: 0,
      });
      expect(res2.success).toBe(false);
    });

    it("rejects invalid date string for registration_deadline", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Valid Title",
        registration_deadline: "not-a-valid-date",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.registration_deadline).toBeDefined();
      }
    });

    it("normalizes and deduplicates required_skill_ids", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Backend Engineer",
        required_skill_ids: [1, 2, 2, 3, 1],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required_skill_ids).toEqual([1, 2, 3]);
      }
    });

    it("rejects if client attempts to pass company_id", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Developer",
        company_id: 42,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company_id).toBeDefined();
      }
    });

    it("rejects if client attempts to pass status", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Developer",
        status: "published",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.status).toBeDefined();
      }
    });

    it("rejects unrecognized extraneous properties (.strict())", () => {
      const result = createOpportunityDraftSchema.safeParse({
        title: "Developer",
        extra_property: "malicious_injection",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listOpportunitiesQuerySchema", () => {
    it("applies default page and limit", () => {
      const result = listOpportunitiesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.status).toBeUndefined();
      }
    });

    it("coerces and accepts valid numeric query parameters", () => {
      const result = listOpportunitiesQuerySchema.safeParse({
        page: "3",
        limit: "25",
        status: "published",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
        expect(result.data.status).toBe("published");
      }
    });

    it("rejects non-positive page numbers", () => {
      const result = listOpportunitiesQuerySchema.safeParse({
        page: "0",
      });
      expect(result.success).toBe(false);
    });

    it("rejects limit greater than 100", () => {
      const result = listOpportunitiesQuerySchema.safeParse({
        limit: "101",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid status filter values (draft, published, closed)", () => {
      for (const status of ["draft", "published", "closed"]) {
        const result = listOpportunitiesQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status filter values", () => {
      const result = listOpportunitiesQuerySchema.safeParse({
        status: "archived",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateOpportunitySchema", () => {
    it("accepts a minimal partial update with title only", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated Title");
        expect(result.data.description).toBeUndefined();
        expect(result.data.type).toBeUndefined();
        expect(result.data.domain_id).toBeUndefined();
        expect(result.data.sub_domain_id).toBeUndefined();
        expect(result.data.registration_deadline).toBeUndefined();
        expect(result.data.required_skill_ids).toBeUndefined();
      }
    });

    it("accepts null for nullable fields to clear values", () => {
      const result = updateOpportunitySchema.safeParse({
        description: null,
        type: null,
        domain_id: null,
        sub_domain_id: null,
        registration_deadline: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
        expect(result.data.type).toBeNull();
        expect(result.data.domain_id).toBeNull();
        expect(result.data.sub_domain_id).toBeNull();
        expect(result.data.registration_deadline).toBeNull();
      }
    });

    it("accepts full valid update payload", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "Senior Node.js Engineer",
        description: "Full-time backend position.",
        type: "job",
        domain_id: 1,
        sub_domain_id: 2,
        registration_deadline: "2026-12-31T23:59:59Z",
        required_skill_ids: [10, 12, 10],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Senior Node.js Engineer");
        expect(result.data.type).toBe("job");
        expect(result.data.domain_id).toBe(1);
        expect(result.data.sub_domain_id).toBe(2);
        expect(result.data.registration_deadline).toBeInstanceOf(Date);
        expect(result.data.required_skill_ids).toEqual([10, 12]);
      }
    });

    it("accepts Date instance for registration_deadline", () => {
      const d = new Date("2026-12-31T23:59:59Z");
      const result = updateOpportunitySchema.safeParse({
        registration_deadline: d,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.registration_deadline).toEqual(d);
      }
    });

    it("distinguishes omitted required_skill_ids from empty array", () => {
      const omitted = updateOpportunitySchema.safeParse({ title: "New Title" });
      expect(omitted.success).toBe(true);
      if (omitted.success) {
        expect(omitted.data.required_skill_ids).toBeUndefined();
      }

      const empty = updateOpportunitySchema.safeParse({ required_skill_ids: [] });
      expect(empty.success).toBe(true);
      if (empty.success) {
        expect(empty.data.required_skill_ids).toEqual([]);
      }
    });

    it("rejects completely empty update payload", () => {
      const result = updateOpportunitySchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "At least one field must be provided for update",
        );
      }
    });

    it("rejects empty or whitespace-only title when provided", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "   ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("rejects title exceeding 255 characters", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "X".repeat(256),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("rejects description exceeding 5000 characters", () => {
      const result = updateOpportunitySchema.safeParse({
        description: "Y".repeat(5001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined();
      }
    });

    it("rejects invalid opportunity type", () => {
      const result = updateOpportunitySchema.safeParse({
        type: "freelance",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.type).toBeDefined();
      }
    });

    it("rejects non-positive domain_id or sub_domain_id", () => {
      const res1 = updateOpportunitySchema.safeParse({ domain_id: -1 });
      expect(res1.success).toBe(false);

      const res2 = updateOpportunitySchema.safeParse({ sub_domain_id: 0 });
      expect(res2.success).toBe(false);
    });

    it("rejects invalid date string for registration_deadline", () => {
      const result = updateOpportunitySchema.safeParse({
        registration_deadline: "not-a-valid-date",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.registration_deadline).toBeDefined();
      }
    });

    it("rejects client-supplied company_id", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "Valid Title",
        company_id: 42,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company_id).toBeDefined();
      }
    });

    it("rejects client-supplied status", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "Valid Title",
        status: "published",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.status).toBeDefined();
      }
    });

    it("rejects unrecognized extraneous properties (.strict())", () => {
      const result = updateOpportunitySchema.safeParse({
        title: "Valid Title",
        injected_field: true,
      });
      expect(result.success).toBe(false);
    });
  });
});
