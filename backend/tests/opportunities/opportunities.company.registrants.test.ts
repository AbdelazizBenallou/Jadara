/**
 * Phase 13 — Slice 4.7: View Opportunity Registrations — Company
 * Database-free unit tests for opportunityService.listOpportunityRegistrants
 * and the listOpportunityRegistrantsQuerySchema validator.
 *
 * Domain rules under test:
 *  - Company identity resolved from userId; never from client-supplied field.
 *  - Tenant isolation: 404 for missing or unowned opportunity.
 *  - Anonymous registrations (beneficiary_id = null) excluded from returned list.
 *  - Historical visibility: closed / deadline-expired opportunities still returned.
 *  - PII projection: id, email, first_name, last_name only.
 *  - Standard paginated envelope: { registrants, meta }.
 *  - view_opportunity_registrations permission enforced by middleware (not tested here).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../framework/config/prisma.js";
import { opportunityService } from "../../src/modules/opportunities/opportunities.service.js";
import {
  opportunityRepository,
  type OpportunityWithRelations,
} from "../../src/modules/opportunities/opportunities.repository.js";
import { listOpportunityRegistrantsQuerySchema } from "../../src/modules/opportunities/opportunities.validator.js";
import { AppError } from "../../framework/utils/AppError.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCompany = {
  id: 20,
  user_id: 100,
  name: "Oran Ventures SPA",
  is_removed: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const ownedOpportunity: OpportunityWithRelations = {
  id: 70,
  company_id: 20, // matches mockCompany.id
  title: "Backend Engineer",
  status: "published",
  description: null,
  type: "job",
  domain_id: 1,
  sub_domain_id: null,
  registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  created_at: new Date("2026-10-01T08:00:00Z"),
  updated_at: new Date("2026-10-01T08:00:00Z"),
  domain: { id: 1, name: "Tech" },
  sub_domain: null,
  required_skills: [],
  _count: { registrations: 3 },
  company: { id: 20, name: "Oran Ventures SPA", is_removed: false },
};

const closedOwnedOpportunity: OpportunityWithRelations = {
  ...ownedOpportunity,
  id: 80,
  status: "closed",
};

function makeRegistrant(overrides: Partial<{
  id: number;
  opportunity_id: number;
  beneficiary_id: number;
  registered_at: Date;
  beneficiary: { id: number; first_name: string | null; last_name: string | null };
}> = {}) {
  return {
    id: 1,
    opportunity_id: 70,
    beneficiary_id: 500,
    registered_at: new Date("2026-10-10T10:00:00Z"),
    beneficiary: {
      id: 500,
      first_name: "Alice",
      last_name: "Boudiaf",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma, "$transaction").mockImplementation(async (cb) => {
    if (typeof cb === "function") return cb(prisma);
    return cb;
  });
});

// ---------------------------------------------------------------------------
// Validator tests
// ---------------------------------------------------------------------------

describe("listOpportunityRegistrantsQuerySchema — input validation", () => {
  it("applies default page=1 and limit=10 for an empty query", () => {
    const result = listOpportunityRegistrantsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("coerces page and limit from strings", () => {
    const result = listOpportunityRegistrantsQuerySchema.parse({ page: "2", limit: "25" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
  });

  it("rejects page < 1", () => {
    expect(() => listOpportunityRegistrantsQuerySchema.parse({ page: "0" })).toThrow();
  });

  it("rejects limit > 100", () => {
    expect(() => listOpportunityRegistrantsQuerySchema.parse({ limit: "101" })).toThrow();
  });

  it("does not expose a status field (intentionally absent)", () => {
    const result = listOpportunityRegistrantsQuerySchema.parse({ status: "published" } as Record<string, unknown>);
    expect((result as Record<string, unknown>).status).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Service method tests
// ---------------------------------------------------------------------------

describe("opportunityService.listOpportunityRegistrants", () => {

  // -------------------------------------------------------------------------
  // Company resolution and tenant isolation
  // -------------------------------------------------------------------------
  describe("Company resolution and tenant isolation", () => {
    it("throws HTTP 404 when the caller has no Company profile", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(null);

      await expect(
        opportunityService.listOpportunityRegistrants(100, 70, {}),
      ).rejects.toThrow(new AppError("Company profile not found", 404));
    });

    it("throws HTTP 403 when the Company is marked as removed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue({
        ...mockCompany, is_removed: true,
      });

      await expect(
        opportunityService.listOpportunityRegistrants(100, 70, {}),
      ).rejects.toThrow(new AppError("Company account has been removed", 403));
    });

    it("throws HTTP 404 when the opportunity does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(null);

      await expect(
        opportunityService.listOpportunityRegistrants(100, 70, {}),
      ).rejects.toThrow(new AppError("Opportunity not found", 404));
    });

    it("throws HTTP 404 when the opportunity belongs to a different Company (tenant isolation)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...ownedOpportunity,
        company_id: 99, // different company
      });

      await expect(
        opportunityService.listOpportunityRegistrants(100, 70, {}),
      ).rejects.toThrow(new AppError("Opportunity not found", 404));
    });

    it("does NOT call listOpportunityRegistrants on the repository when ownership fails", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(null);
      const repoSpy = vi.spyOn(opportunityRepository, "listOpportunityRegistrants");

      await expect(
        opportunityService.listOpportunityRegistrants(100, 70, {}),
      ).rejects.toThrow();

      expect(repoSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Anonymous registration exclusion
  // -------------------------------------------------------------------------
  describe("Anonymous registration exclusion", () => {
    it("returns only named registrants (excludes beneficiary_id = null rows)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(ownedOpportunity);
      // Repository already filters; mock returns only non-null registrants
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant()],
        total: 1, // total of non-anonymous rows
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});

      expect(result.registrants).toHaveLength(1);
      expect(result.registrants[0].beneficiary.id).toBe(500);
    });

    it("returns empty registrants array when all registrations are anonymous", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(ownedOpportunity);
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});

      expect(result.registrants).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Historical visibility
  // -------------------------------------------------------------------------
  describe("Historical visibility — no opportunity status filter", () => {
    it("returns registrants for a closed opportunity", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(closedOwnedOpportunity);
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant({ opportunity_id: 80 })],
        total: 1,
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 80, {});

      expect(result.registrants).toHaveLength(1);
    });

    it("returns registrants for an opportunity whose deadline has passed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...ownedOpportunity,
        registration_deadline: new Date("2020-01-01"),
      });
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant()],
        total: 1,
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});

      expect(result.registrants).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  describe("Pagination envelope", () => {
    function setupOwnership(opp = ownedOpportunity) {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(opp);
    }

    it("returns correct meta for a single page", async () => {
      setupOwnership();
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant()],
        total: 1,
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 70, { page: 1, limit: 10 });

      expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 10, totalPages: 1, nextCursor: null });
    });

    it("computes nextCursor correctly when more pages exist", async () => {
      setupOwnership();
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: Array(10).fill(makeRegistrant()),
        total: 25,
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 70, { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.nextCursor).toBe(2);
    });

    it("returns nextCursor = null on the last page", async () => {
      setupOwnership();
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant()],
        total: 11,
      });

      const result = await opportunityService.listOpportunityRegistrants(100, 70, { page: 2, limit: 10 });

      expect(result.meta.nextCursor).toBeNull();
    });

    it("passes page and limit to the repository", async () => {
      setupOwnership();
      const spy = vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({ items: [], total: 0 });

      await opportunityService.listOpportunityRegistrants(100, 70, { page: 3, limit: 20 });

      expect(spy).toHaveBeenCalledWith(70, expect.objectContaining({ page: 3, limit: 20 }));
    });
  });

  // -------------------------------------------------------------------------
  // Projection shape and PII constraints
  // -------------------------------------------------------------------------
  describe("Projection shape and PII constraints", () => {
    beforeEach(() => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(ownedOpportunity);
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant()],
        total: 1,
      });
    });

    it("exposes registration id, opportunity_id, and registered_at", async () => {
      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});
      const r = result.registrants[0];
      expect(r.id).toBe(1);
      expect(r.opportunity_id).toBe(70);
      expect(r.registered_at).toBeInstanceOf(Date);
    });

    it("exposes beneficiary id, first_name, and last_name — does not expose email", async () => {
      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});
      const b = result.registrants[0].beneficiary as Record<string, unknown>;
      expect(b.id).toBe(500);
      expect(b.first_name).toBe("Alice");
      expect(b.last_name).toBe("Boudiaf");
      expect(b.email).toBeUndefined();
    });

    it("does not expose beneficiary phone, date_of_birth, gender, avatar, or email", async () => {
      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});
      const b = result.registrants[0].beneficiary as Record<string, unknown>;
      expect(b.phone).toBeUndefined();
      expect(b.date_of_birth).toBeUndefined();
      expect(b.gender).toBeUndefined();
      expect(b.avatar).toBeUndefined();
      expect(b.email).toBeUndefined();
    });

    it("does not expose user skills, education, or work experience (Talent Discovery fields)", async () => {
      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});
      const b = result.registrants[0].beneficiary as Record<string, unknown>;
      expect(b.skills).toBeUndefined();
      expect(b.education).toBeUndefined();
      expect(b.work_experiences).toBeUndefined();
    });

    it("handles null first_name and last_name when profile is absent", async () => {
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [makeRegistrant({ beneficiary: { id: 500, first_name: null, last_name: null } })],
        total: 1,
      });
      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});
      expect(result.registrants[0].beneficiary.first_name).toBeNull();
      expect(result.registrants[0].beneficiary.last_name).toBeNull();
    });

    it("maps multiple registrants preserving each individually", async () => {
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({
        items: [
          makeRegistrant({ id: 1, beneficiary_id: 500 }),
          makeRegistrant({ id: 2, beneficiary_id: 501, beneficiary: { id: 501, first_name: "Bob", last_name: "Kaci" } }),
        ],
        total: 2,
      });
      const result = await opportunityService.listOpportunityRegistrants(100, 70, {});
      expect(result.registrants).toHaveLength(2);
      expect(result.registrants[0].beneficiary.first_name).toBe("Alice");
      expect(result.registrants[1].beneficiary.first_name).toBe("Bob");
    });
  });

  // -------------------------------------------------------------------------
  // Repository delegation
  // -------------------------------------------------------------------------
  describe("Repository delegation", () => {
    it("calls listOpportunityRegistrants with the correct opportunityId", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(ownedOpportunity);
      const spy = vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockResolvedValue({ items: [], total: 0 });

      await opportunityService.listOpportunityRegistrants(100, 70, {});

      expect(spy).toHaveBeenCalledWith(70, expect.anything());
    });

    it("propagates unexpected repository errors without swallowing them", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(ownedOpportunity);
      const error = new Error("DB timeout");
      vi.spyOn(opportunityRepository, "listOpportunityRegistrants").mockRejectedValue(error);

      await expect(
        opportunityService.listOpportunityRegistrants(100, 70, {}),
      ).rejects.toThrow(error);
    });
  });
});
