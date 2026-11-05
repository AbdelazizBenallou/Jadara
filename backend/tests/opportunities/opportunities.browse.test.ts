/**
 * Phase 13 — Browse Published Opportunities
 * Database-free unit tests for opportunityService.browse and the
 * browsePublishedQuerySchema validator.
 *
 * Approved rules under test:
 *  - Only status='published' rows are returned (hard-coded in repository layer)
 *  - Optional filters: domain_id, type, q (keyword)
 *  - registration_open = true only when deadline > now AND company is not removed
 *  - Opportunities with registration_open=false are still returned (not hidden)
 *  - PII-safe: no beneficiary data exposed
 *  - Standard paginated envelope (meta: total, page, limit, totalPages, nextCursor)
 *  - Validator rejects invalid types; status filter is intentionally absent
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { opportunityService } from "../../src/modules/opportunities/opportunities.service.js";
import {
  opportunityRepository,
  type OpportunityWithRelations,
} from "../../src/modules/opportunities/opportunities.repository.js";
import { browsePublishedQuerySchema } from "../../src/modules/opportunities/opportunities.validator.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const futureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const pastDeadline = new Date("2020-01-01T00:00:00Z");

const baseOpportunity: OpportunityWithRelations = {
  id: 1,
  company_id: 10,
  title: "Senior Data Engineer",
  status: "published",
  description: "Build our data platform.",
  type: "job",
  domain_id: 3,
  sub_domain_id: 7,
  registration_deadline: futureDeadline,
  created_at: new Date("2026-10-01T10:00:00Z"),
  updated_at: new Date("2026-10-01T10:00:00Z"),
  domain: { id: 3, name: "Data Science & AI" },
  sub_domain: { id: 7, name: "Machine Learning", domain_id: 3 },
  required_skills: [
    {
      id: 5,
      opportunity_id: 1,
      skill_id: 14,
      skill: { id: 14, name: "Python", category_id: 1 },
    },
  ],
  _count: { registrations: 3 },
  company: { id: 10, name: "Oran Ventures SPA", is_removed: false },
};

const secondOpportunity: OpportunityWithRelations = {
  ...baseOpportunity,
  id: 2,
  title: "UX Design Internship",
  type: "internship",
  domain_id: 5,
  sub_domain_id: 11,
  domain: { id: 5, name: "Design" },
  sub_domain: { id: 11, name: "UX/UI", domain_id: 5 },
};

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Validator tests
// ---------------------------------------------------------------------------

describe("browsePublishedQuerySchema — input validation", () => {
  it("accepts an empty query and applies defaults", () => {
    const result = browsePublishedQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.domain_id).toBeUndefined();
    expect(result.type).toBeUndefined();
    expect(result.q).toBeUndefined();
  });

  it("coerces page and limit from strings", () => {
    const result = browsePublishedQuerySchema.parse({ page: "2", limit: "20" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it("accepts valid domain_id as a positive integer", () => {
    const result = browsePublishedQuerySchema.parse({ domain_id: "3" });
    expect(result.domain_id).toBe(3);
  });

  it("accepts valid type values", () => {
    for (const t of ["job", "internship", "project_freelance"]) {
      const result = browsePublishedQuerySchema.parse({ type: t });
      expect(result.type).toBe(t);
    }
  });

  it("rejects an invalid type value", () => {
    expect(() => browsePublishedQuerySchema.parse({ type: "grant" })).toThrow();
  });

  it("accepts a keyword q string and trims whitespace", () => {
    const result = browsePublishedQuerySchema.parse({ q: "  engineer  " });
    expect(result.q).toBe("engineer");
  });

  it("rejects q longer than 100 characters", () => {
    expect(() =>
      browsePublishedQuerySchema.parse({ q: "a".repeat(101) }),
    ).toThrow();
  });

  it("strips unknown fields including status (no status filter exposed)", () => {
    const result = browsePublishedQuerySchema.parse({ status: "draft", page: "1" });
    expect((result as Record<string, unknown>).status).toBeUndefined();
  });

  it("rejects domain_id = 0 (not positive)", () => {
    expect(() => browsePublishedQuerySchema.parse({ domain_id: "0" })).toThrow();
  });

  it("rejects limit > 100", () => {
    expect(() => browsePublishedQuerySchema.parse({ limit: "200" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Service method tests
// ---------------------------------------------------------------------------

describe("opportunityService.browse", () => {

  describe("Pagination and meta envelope", () => {
    it("returns the standard paginated meta envelope", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [baseOpportunity],
        total: 1,
      });

      const result = await opportunityService.browse({ page: 1, limit: 10 });

      expect(result.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextCursor: null,
      });
      expect(result.opportunities).toHaveLength(1);
    });

    it("computes nextCursor correctly when more pages exist", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: Array(10).fill(baseOpportunity),
        total: 25,
      });

      const result = await opportunityService.browse({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.nextCursor).toBe(2);
    });

    it("returns nextCursor = null on the last page", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [baseOpportunity],
        total: 11,
      });

      const result = await opportunityService.browse({ page: 2, limit: 10 });

      expect(result.meta.nextCursor).toBeNull();
    });

    it("passes page and limit to listPublished", async () => {
      const spy = vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [],
        total: 0,
      });

      await opportunityService.browse({ page: 3, limit: 20 });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ page: 3, limit: 20 }));
    });

    it("returns empty opportunities array when no results", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await opportunityService.browse({});

      expect(result.opportunities).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.nextCursor).toBeNull();
    });
  });

  describe("Filter delegation to repository", () => {
    it("passes domain_id filter to listPublished when provided", async () => {
      const spy = vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({ items: [], total: 0 });
      await opportunityService.browse({ domain_id: 3 });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ domain_id: 3 }));
    });

    it("passes type filter to listPublished when provided", async () => {
      const spy = vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({ items: [], total: 0 });
      await opportunityService.browse({ type: "job" });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "job" }));
    });

    it("passes q keyword filter to listPublished when provided", async () => {
      const spy = vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({ items: [], total: 0 });
      await opportunityService.browse({ q: "engineer" });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ q: "engineer" }));
    });

    it("omits optional filter fields when not supplied", async () => {
      const spy = vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({ items: [], total: 0 });
      await opportunityService.browse({});
      const [calledWith] = spy.mock.calls[0];
      expect(calledWith.domain_id).toBeUndefined();
      expect(calledWith.type).toBeUndefined();
      expect(calledWith.q).toBeUndefined();
    });
  });

  describe("registration_open flag", () => {
    it("is true when deadline is in the future and company is not removed", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [{ ...baseOpportunity, registration_deadline: futureDeadline }],
        total: 1,
      });
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].registration_open).toBe(true);
    });

    it("is false when deadline is in the past (even if company is active)", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [{ ...baseOpportunity, registration_deadline: pastDeadline }],
        total: 1,
      });
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].registration_open).toBe(false);
    });

    it("is false when deadline is null", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [{ ...baseOpportunity, registration_deadline: null }],
        total: 1,
      });
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].registration_open).toBe(false);
    });

    it("is false when company is removed (even if deadline is in the future)", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [{
          ...baseOpportunity,
          registration_deadline: futureDeadline,
          company: { id: 10, name: "Oran Ventures SPA", is_removed: true },
        }],
        total: 1,
      });
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].registration_open).toBe(false);
    });

    it("opportunity with registration_open=false is still returned (not hidden)", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [
          { ...baseOpportunity, registration_deadline: pastDeadline },
          { ...secondOpportunity, registration_deadline: futureDeadline },
        ],
        total: 2,
      });
      const result = await opportunityService.browse({});
      expect(result.opportunities).toHaveLength(2);
      expect(result.opportunities[0].registration_open).toBe(false);
      expect(result.opportunities[1].registration_open).toBe(true);
    });
  });

  describe("Response projection and PII safety", () => {
    beforeEach(() => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [baseOpportunity],
        total: 1,
      });
    });

    it("includes company_name in the response", async () => {
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].company_name).toBe("Oran Ventures SPA");
    });

    it("includes registrations_count in the response", async () => {
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].registrations_count).toBe(3);
    });

    it("does not expose individual registrations or beneficiary PII", async () => {
      const result = await opportunityService.browse({});
      const opp = result.opportunities[0] as Record<string, unknown>;
      expect(opp.registrations).toBeUndefined();
      expect(opp.beneficiary).toBeUndefined();
    });

    it("includes domain and sub_domain objects", async () => {
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].domain).toMatchObject({ id: 3, name: "Data Science & AI" });
      expect(result.opportunities[0].sub_domain).toMatchObject({ id: 7, name: "Machine Learning" });
    });

    it("includes required_skills as a flat array (not nested join rows)", async () => {
      const result = await opportunityService.browse({});
      const skills = result.opportunities[0].required_skills;
      expect(skills).toHaveLength(1);
      expect(skills[0]).toMatchObject({ id: 14, name: "Python", category_id: 1 });
    });

    it("includes registration_deadline in the response", async () => {
      const result = await opportunityService.browse({});
      expect(result.opportunities[0].registration_deadline).toEqual(futureDeadline);
    });

    it("maps multiple opportunities preserving each individually", async () => {
      vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [baseOpportunity, secondOpportunity],
        total: 2,
      });
      const result = await opportunityService.browse({});
      expect(result.opportunities).toHaveLength(2);
      expect(result.opportunities[0].id).toBe(1);
      expect(result.opportunities[1].id).toBe(2);
      expect(result.opportunities[1].type).toBe("internship");
    });
  });

  describe("Repository delegation", () => {
    it("calls listPublished exactly once per browse invocation", async () => {
      const spy = vi.spyOn(opportunityRepository, "listPublished").mockResolvedValue({
        items: [],
        total: 0,
      });
      await opportunityService.browse({});
      expect(spy).toHaveBeenCalledOnce();
    });

    it("propagates unexpected repository errors without swallowing them", async () => {
      const error = new Error("Database connection lost");
      vi.spyOn(opportunityRepository, "listPublished").mockRejectedValue(error);
      await expect(opportunityService.browse({})).rejects.toThrow(error);
    });
  });
});
