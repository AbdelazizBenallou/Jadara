/**
 * Phase 13 — Slice 4.6: View Own Registrations
 * Database-free unit tests for opportunityService.listMyRegistrations and
 * the listMyRegistrationsQuerySchema validator.
 *
 * Domain rules under test:
 *  - Scoped exclusively to the authenticated userId (no client-supplied beneficiary_id).
 *  - Both published and closed opportunities are returned (no status filter).
 *  - Historical registrations remain visible after opportunity closure.
 *  - Standard paginated envelope: { registrations, meta }.
 *  - PII-safe: no beneficiary profile data, no other registrants exposed.
 *  - Opportunity summary: id, title, status, type, domain_id, deadline, company name.
 *  - Empty list returns cleanly.
 *  - view_own_registrations permission required (enforced by middleware, not tested here).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { opportunityService } from "../../src/modules/opportunities/opportunities.service.js";
import { opportunityRepository } from "../../src/modules/opportunities/opportunities.repository.js";
import { listMyRegistrationsQuerySchema } from "../../src/modules/opportunities/opportunities.validator.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const futureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const pastDeadline   = new Date("2020-01-01T00:00:00Z");

function makeRegistration(overrides: Partial<{
  id: number;
  opportunity_id: number;
  beneficiary_id: number | null;
  created_at: Date;
  opportunity: {
    id: number;
    title: string;
    status: string;
    type: string | null;
    domain_id: number | null;
    registration_deadline: Date | null;
    company: { id: number; name: string } | null;
  };
}> = {}) {
  return {
    id: 1,
    opportunity_id: 70,
    beneficiary_id: 500,
    created_at: new Date("2026-10-10T10:00:00Z"),
    opportunity: {
      id: 70,
      title: "Backend Engineer",
      status: "published",
      type: "job",
      domain_id: 1,
      registration_deadline: futureDeadline,
      company: { id: 20, name: "Oran Ventures SPA" },
    },
    ...overrides,
  };
}

const closedRegistration = makeRegistration({
  id: 2,
  opportunity_id: 80,
  created_at: new Date("2026-09-01T09:00:00Z"),
  opportunity: {
    id: 80,
    title: "UX Internship",
    status: "closed",
    type: "internship",
    domain_id: 5,
    registration_deadline: pastDeadline,
    company: { id: 30, name: "Algiers Design Co" },
  },
});

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Validator tests
// ---------------------------------------------------------------------------

describe("listMyRegistrationsQuerySchema — input validation", () => {
  it("applies default page=1 and limit=10 for an empty query", () => {
    const result = listMyRegistrationsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("coerces page and limit from strings", () => {
    const result = listMyRegistrationsQuerySchema.parse({ page: "3", limit: "25" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
  });

  it("rejects page < 1", () => {
    expect(() => listMyRegistrationsQuerySchema.parse({ page: "0" })).toThrow();
  });

  it("rejects limit > 100", () => {
    expect(() => listMyRegistrationsQuerySchema.parse({ limit: "101" })).toThrow();
  });

  it("rejects limit < 1", () => {
    expect(() => listMyRegistrationsQuerySchema.parse({ limit: "0" })).toThrow();
  });

  it("does not expose a status field (intentionally absent)", () => {
    const result = listMyRegistrationsQuerySchema.parse({ status: "published" } as Record<string, unknown>);
    expect((result as Record<string, unknown>).status).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Service method tests
// ---------------------------------------------------------------------------

describe("opportunityService.listMyRegistrations", () => {

  // -------------------------------------------------------------------------
  // Ownership isolation
  // -------------------------------------------------------------------------
  describe("Ownership isolation", () => {
    it("passes the authenticated userId to listMyRegistrations (never a client id)", async () => {
      const spy = vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [],
        total: 0,
      });

      await opportunityService.listMyRegistrations(500, {});

      expect(spy).toHaveBeenCalledWith(500, expect.objectContaining({ page: 1, limit: 10 }));
    });

    it("uses the userId from the caller — a different userId fetches different data", async () => {
      const spy = vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [],
        total: 0,
      });

      await opportunityService.listMyRegistrations(999, {});

      expect(spy).toHaveBeenCalledWith(999, expect.anything());
    });
  });

  // -------------------------------------------------------------------------
  // Historical visibility
  // -------------------------------------------------------------------------
  describe("Historical visibility — no status filter applied", () => {
    it("returns both published and closed opportunity registrations", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration(), closedRegistration],
        total: 2,
      });

      const result = await opportunityService.listMyRegistrations(500, {});

      expect(result.registrations).toHaveLength(2);
      expect(result.registrations[0].opportunity?.status).toBe("published");
      expect(result.registrations[1].opportunity?.status).toBe("closed");
    });

    it("returns a registration for an opportunity whose deadline has passed", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration({ opportunity: { ...makeRegistration().opportunity, registration_deadline: pastDeadline, status: "published" } })],
        total: 1,
      });

      const result = await opportunityService.listMyRegistrations(500, {});

      expect(result.registrations[0].opportunity?.registration_deadline).toEqual(pastDeadline);
    });

    it("returns a registration for a closed opportunity (not hidden after closure)", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [closedRegistration],
        total: 1,
      });

      const result = await opportunityService.listMyRegistrations(500, {});

      expect(result.registrations).toHaveLength(1);
      expect(result.registrations[0].opportunity?.status).toBe("closed");
    });
  });

  // -------------------------------------------------------------------------
  // Empty result
  // -------------------------------------------------------------------------
  describe("Empty result", () => {
    it("returns an empty registrations array and zero meta when no registrations exist", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await opportunityService.listMyRegistrations(500, {});

      expect(result.registrations).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.nextCursor).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  describe("Pagination envelope", () => {
    it("returns correct meta for a single page of results", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration()],
        total: 1,
      });

      const result = await opportunityService.listMyRegistrations(500, { page: 1, limit: 10 });

      expect(result.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextCursor: null,
      });
    });

    it("computes nextCursor when more pages remain", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: Array(10).fill(makeRegistration()),
        total: 25,
      });

      const result = await opportunityService.listMyRegistrations(500, { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.nextCursor).toBe(2);
    });

    it("sets nextCursor to null on the final page", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration()],
        total: 11,
      });

      const result = await opportunityService.listMyRegistrations(500, { page: 2, limit: 10 });

      expect(result.meta.nextCursor).toBeNull();
    });

    it("passes page and limit to repository", async () => {
      const spy = vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [],
        total: 0,
      });

      await opportunityService.listMyRegistrations(500, { page: 4, limit: 20 });

      expect(spy).toHaveBeenCalledWith(500, expect.objectContaining({ page: 4, limit: 20 }));
    });
  });

  // -------------------------------------------------------------------------
  // Projection shape and PII safety
  // -------------------------------------------------------------------------
  describe("Projection shape and PII safety", () => {
    beforeEach(() => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration()],
        total: 1,
      });
    });

    it("exposes registration id, opportunity_id, and registered_at", async () => {
      const result = await opportunityService.listMyRegistrations(500, {});
      const reg = result.registrations[0];
      expect(reg.id).toBe(1);
      expect(reg.opportunity_id).toBe(70);
      expect(reg.registered_at).toBeInstanceOf(Date);
    });

    it("exposes opportunity summary fields: id, title, status, type, domain_id, deadline, company", async () => {
      const result = await opportunityService.listMyRegistrations(500, {});
      const opp = result.registrations[0].opportunity!;
      expect(opp.id).toBe(70);
      expect(opp.title).toBe("Backend Engineer");
      expect(opp.status).toBe("published");
      expect(opp.type).toBe("job");
      expect(opp.domain_id).toBe(1);
      expect(opp.registration_deadline).toEqual(futureDeadline);
      expect(opp.company).toMatchObject({ id: 20, name: "Oran Ventures SPA" });
    });

    it("does not expose beneficiary profile data or PII", async () => {
      const result = await opportunityService.listMyRegistrations(500, {});
      const reg = result.registrations[0] as Record<string, unknown>;
      expect(reg.profile).toBeUndefined();
      expect(reg.email).toBeUndefined();
      expect(reg.first_name).toBeUndefined();
    });

    it("does not expose company-private registration lists or other registrants", async () => {
      const result = await opportunityService.listMyRegistrations(500, {});
      const reg = result.registrations[0] as Record<string, unknown>;
      expect(reg.registrations).toBeUndefined();
      expect(reg.other_registrants).toBeUndefined();
    });

    it("does not expose company is_removed field (only id and name)", async () => {
      const result = await opportunityService.listMyRegistrations(500, {});
      const company = result.registrations[0].opportunity?.company as Record<string, unknown> | null;
      expect(company).toBeDefined();
      expect(company!.is_removed).toBeUndefined();
    });

    it("maps multiple registrations preserving each individually", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration(), closedRegistration],
        total: 2,
      });

      const result = await opportunityService.listMyRegistrations(500, {});
      expect(result.registrations).toHaveLength(2);
      expect(result.registrations[0].id).toBe(1);
      expect(result.registrations[1].id).toBe(2);
    });

    it("returns null for opportunity.company when company field is null", async () => {
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [makeRegistration({ opportunity: { ...makeRegistration().opportunity, company: null } })],
        total: 1,
      });

      const result = await opportunityService.listMyRegistrations(500, {});
      expect(result.registrations[0].opportunity?.company).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Repository delegation
  // -------------------------------------------------------------------------
  describe("Repository delegation", () => {
    it("calls listMyRegistrations exactly once per service invocation", async () => {
      const spy = vi.spyOn(opportunityRepository, "listMyRegistrations").mockResolvedValue({
        items: [],
        total: 0,
      });

      await opportunityService.listMyRegistrations(500, {});

      expect(spy).toHaveBeenCalledOnce();
    });

    it("propagates unexpected repository errors without swallowing them", async () => {
      const error = new Error("Database unavailable");
      vi.spyOn(opportunityRepository, "listMyRegistrations").mockRejectedValue(error);

      await expect(opportunityService.listMyRegistrations(500, {})).rejects.toThrow(error);
    });
  });
});
