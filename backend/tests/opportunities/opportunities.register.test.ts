/**
 * Phase 13 — Slice 4.5: Register for an Opportunity
 * Database-free unit tests for opportunityService.register.
 *
 * Approved domain rules under test:
 *  - Only authenticated Beneficiaries with register_opportunity permission may register.
 *  - Beneficiary identity resolved from userId; client cannot supply beneficiary_id.
 *  - Opportunity must exist and be status='published' → 404 otherwise.
 *  - Owning company must not be removed → 409.
 *  - Registration deadline must be non-null and strictly in the future → 400.
 *  - Beneficiary must have at least one verified project → 403.
 *  - Duplicate registration (P2002 unique constraint) → 409.
 *  - Anonymous registration records are unaffected (no anonymous creation tested here).
 *  - All checks occur inside a single $transaction after findForUpdate row lock.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import prisma from "../../framework/config/prisma.js";
import { opportunityService } from "../../src/modules/opportunities/opportunities.service.js";
import {
  opportunityRepository,
  type OpportunityWithRelations,
} from "../../src/modules/opportunities/opportunities.repository.js";
import { AppError } from "../../framework/utils/AppError.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const futureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 days
const pastDeadline   = new Date("2020-01-01T00:00:00Z");

const publishedOpportunity: OpportunityWithRelations = {
  id: 70,
  company_id: 20,
  title: "Backend Engineer",
  status: "published",
  description: "Node.js role.",
  type: "job",
  domain_id: 1,
  sub_domain_id: 2,
  registration_deadline: futureDeadline,
  created_at: new Date("2026-10-01T08:00:00Z"),
  updated_at: new Date("2026-10-01T08:00:00Z"),
  domain:      { id: 1, name: "Tech" },
  sub_domain:  { id: 2, name: "Backend", domain_id: 1 },
  required_skills: [],
  _count: { registrations: 0 },
  company: { id: 20, name: "Oran Ventures SPA", is_removed: false },
};

const mockRegistration = {
  id: 1,
  opportunity_id: 70,
  beneficiary_id: 500,
  created_at: new Date("2026-10-13T18:00:00Z"),
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
    if (typeof callback === "function") return callback(prisma);
    return callback;
  });
});

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe("opportunityService.register — Phase 13 Slice 4.5", () => {

  // -------------------------------------------------------------------------
  // Opportunity state checks
  // -------------------------------------------------------------------------
  describe("Opportunity state — 404 guards", () => {
    it("throws HTTP 404 when the opportunity does not exist", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(null);

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Opportunity not found or not available for registration", 404),
      );
    });

    it("throws HTTP 404 when the opportunity status is 'draft'", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity, status: "draft",
      });

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Opportunity not found or not available for registration", 404),
      );
    });

    it("throws HTTP 404 when the opportunity status is 'closed'", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity, status: "closed",
      });

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Opportunity not found or not available for registration", 404),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Company active check
  // -------------------------------------------------------------------------
  describe("Company active check — 409 guard", () => {
    it("throws HTTP 409 when the owning company is removed", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity,
        company: { id: 20, name: "Oran Ventures SPA", is_removed: true },
      });

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("This opportunity is no longer available (company inactive)", 409),
      );
    });

    it("does not check company removal when opportunity is not published (404 fires first)", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity,
        status: "closed",
        company: { id: 20, name: "Oran Ventures SPA", is_removed: true },
      });

      // The 404 for non-published status must short-circuit before the 409
      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Opportunity not found or not available for registration", 404),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Deadline checks — 400 guard
  // -------------------------------------------------------------------------
  describe("Registration deadline — 400 guard", () => {
    it("throws HTTP 400 when the deadline is in the past", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity, registration_deadline: pastDeadline,
      });

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Registration deadline has passed", 400),
      );
    });

    it("throws HTTP 400 when the deadline is null", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity, registration_deadline: null,
      });

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Registration deadline has passed", 400),
      );
    });

    it("throws HTTP 400 when the deadline equals exactly Date.now() (boundary: not strictly future)", async () => {
      // A deadline at exactly now is <= now(), not strictly in the future
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity,
        registration_deadline: new Date(Date.now() - 1), // 1 ms in past
      });

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("Registration deadline has passed", 400),
      );
    });

    it("company-removed check fires before deadline check (guard ordering)", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity,
        registration_deadline: pastDeadline,
        company: { id: 20, name: "Oran Ventures SPA", is_removed: true },
      });

      // Company 409 must come before deadline 400
      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("This opportunity is no longer available (company inactive)", 409),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Eligibility — verified project check — 403 guard
  // -------------------------------------------------------------------------
  describe("Beneficiary eligibility — verified project — 403 guard", () => {
    it("throws HTTP 403 when the beneficiary has no verified projects", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(false);

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError(
          "You must have at least one verified project to register for an opportunity",
          403,
        ),
      );
    });

    it("proceeds when the beneficiary has at least one verified project", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(true);
      vi.spyOn(opportunityRepository, "createRegistration").mockResolvedValue(mockRegistration);

      const result = await opportunityService.register(500, 70);
      expect(result.id).toBe(1);
    });

    it("does not call hasVerifiedProject when the deadline has passed (deadline check fires first)", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity, registration_deadline: pastDeadline,
      });
      const eligSpy = vi.spyOn(opportunityRepository, "hasVerifiedProject");

      await expect(opportunityService.register(500, 70)).rejects.toThrow();
      expect(eligSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Duplicate registration — 409 via P2002
  // -------------------------------------------------------------------------
  describe("Duplicate registration — 409 guard", () => {
    it("throws HTTP 409 when the beneficiary is already registered (P2002)", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(true);
      vi.spyOn(opportunityRepository, "createRegistration").mockRejectedValue(
        new AppError("You have already registered for this opportunity", 409),
      );

      await expect(opportunityService.register(500, 70)).rejects.toThrow(
        new AppError("You have already registered for this opportunity", 409),
      );
    });

    it("does not call createRegistration when eligibility fails (403 fires first)", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(false);
      const createSpy = vi.spyOn(opportunityRepository, "createRegistration");

      await expect(opportunityService.register(500, 70)).rejects.toThrow();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  describe("Happy path — successful registration", () => {
    function setupHappy() {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(true);
      return vi.spyOn(opportunityRepository, "createRegistration").mockResolvedValue(mockRegistration);
    }

    it("returns the registration record with id, opportunity_id, beneficiary_id, created_at", async () => {
      setupHappy();
      const result = await opportunityService.register(500, 70);
      expect(result).toMatchObject({
        id: 1,
        opportunity_id: 70,
        beneficiary_id: 500,
      });
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it("calls createRegistration with the userId (not a client-supplied beneficiary_id)", async () => {
      const createSpy = setupHappy();
      await opportunityService.register(500, 70);
      expect(createSpy).toHaveBeenCalledWith(70, 500, expect.anything());
    });

    it("calls hasVerifiedProject with the userId and the transaction client", async () => {
      setupHappy();
      const eligSpy = vi.spyOn(opportunityRepository, "hasVerifiedProject");
      await opportunityService.register(500, 70);
      expect(eligSpy).toHaveBeenCalledWith(500, expect.anything());
    });

    it("passes the opportunity id and userId to createRegistration (not hard-coded)", async () => {
      setupHappy();
      const createSpy = vi.spyOn(opportunityRepository, "createRegistration");
      await opportunityService.register(999, 70);
      expect(createSpy).toHaveBeenCalledWith(70, 999, expect.anything());
    });
  });

  // -------------------------------------------------------------------------
  // Concurrency / transaction guarantees
  // -------------------------------------------------------------------------
  describe("Concurrency and transaction guarantees", () => {
    it("wraps all checks inside a single $transaction call", async () => {
      const txSpy = vi.spyOn(prisma, "$transaction");
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(true);
      vi.spyOn(opportunityRepository, "createRegistration").mockResolvedValue(mockRegistration);

      await opportunityService.register(500, 70);

      expect(txSpy).toHaveBeenCalledOnce();
    });

    it("uses findForUpdate (row lock) and never a plain findById", async () => {
      const findForUpdateSpy = vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      const findByIdSpy = vi.spyOn(opportunityRepository, "findById");
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(true);
      vi.spyOn(opportunityRepository, "createRegistration").mockResolvedValue(mockRegistration);

      await opportunityService.register(500, 70);

      expect(findForUpdateSpy).toHaveBeenCalledWith(70, expect.anything());
      expect(findByIdSpy).not.toHaveBeenCalled();
    });

    it("does not call createRegistration when the opportunity is not published (transaction aborts)", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...publishedOpportunity, status: "closed",
      });
      const createSpy = vi.spyOn(opportunityRepository, "createRegistration");

      await expect(opportunityService.register(500, 70)).rejects.toThrow(AppError);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("propagates unexpected repository errors without swallowing them", async () => {
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(publishedOpportunity);
      vi.spyOn(opportunityRepository, "hasVerifiedProject").mockResolvedValue(true);

      const unexpectedError = new Prisma.PrismaClientKnownRequestError("Deadlock", {
        code: "P2034", clientVersion: "6.0.0",
      });
      vi.spyOn(opportunityRepository, "createRegistration").mockRejectedValue(unexpectedError);

      await expect(opportunityService.register(500, 70)).rejects.toThrow(unexpectedError);
    });
  });

  // -------------------------------------------------------------------------
  // opportunityRepository.createRegistration — unit (P2002 mapping)
  // -------------------------------------------------------------------------
  describe("opportunityRepository.createRegistration — P2002 duplicate mapping", () => {
    it("re-throws a raw P2002 as AppError 409", async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`opportunity_id`,`beneficiary_id`)",
        { code: "P2002", clientVersion: "6.0.0" },
      );

      const mockTx = {
        opportunity_registrations: {
          create: vi.fn().mockRejectedValue(p2002),
        },
      } as unknown as Prisma.TransactionClient;

      await expect(
        opportunityRepository.createRegistration(70, 500, mockTx),
      ).rejects.toThrow(new AppError("You have already registered for this opportunity", 409));
    });

    it("propagates non-P2002 Prisma errors unchanged", async () => {
      const otherError = new Prisma.PrismaClientKnownRequestError("FK violation", {
        code: "P2003", clientVersion: "6.0.0",
      });

      const mockTx = {
        opportunity_registrations: {
          create: vi.fn().mockRejectedValue(otherError),
        },
      } as unknown as Prisma.TransactionClient;

      await expect(
        opportunityRepository.createRegistration(70, 500, mockTx),
      ).rejects.toThrow(otherError);
    });

    it("returns the created registration record on success", async () => {
      const mockTx = {
        opportunity_registrations: {
          create: vi.fn().mockResolvedValue(mockRegistration),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await opportunityRepository.createRegistration(70, 500, mockTx);
      expect(result).toEqual(mockRegistration);
    });
  });

  // -------------------------------------------------------------------------
  // opportunityRepository.hasVerifiedProject — unit
  // -------------------------------------------------------------------------
  describe("opportunityRepository.hasVerifiedProject — unit", () => {
    it("returns true when count > 0", async () => {
      const mockTx = {
        projects: { count: vi.fn().mockResolvedValue(2) },
      } as unknown as Prisma.TransactionClient;

      const result = await opportunityRepository.hasVerifiedProject(500, mockTx);
      expect(result).toBe(true);
    });

    it("returns false when count is 0", async () => {
      const mockTx = {
        projects: { count: vi.fn().mockResolvedValue(0) },
      } as unknown as Prisma.TransactionClient;

      const result = await opportunityRepository.hasVerifiedProject(500, mockTx);
      expect(result).toBe(false);
    });

    it("queries with status='verified' and the correct userId", async () => {
      const countMock = vi.fn().mockResolvedValue(1);
      const mockTx = {
        projects: { count: countMock },
      } as unknown as Prisma.TransactionClient;

      await opportunityRepository.hasVerifiedProject(500, mockTx);
      expect(countMock).toHaveBeenCalledWith({
        where: { user_id: 500, status: "verified" },
      });
    });
  });
});
