/**
 * Phase 13 — Slice 4.2: Publish Opportunity
 * Database-free unit tests for opportunityService.publish.
 *
 * Conventions:
 *  - Mirrors the style of opportunities.service.test.ts exactly.
 *  - All Prisma and repository calls are intercepted by vi.spyOn.
 *  - nowMs() is exported from the service and can be spied on for deadline boundary tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../framework/config/prisma.js";
import { Prisma } from "@prisma/client";
import { opportunityService } from "../../src/modules/opportunities/opportunities.service.js";
import {
  opportunityRepository,
  type OpportunityWithRelations,
} from "../../src/modules/opportunities/opportunities.repository.js";
import { AppError } from "../../framework/utils/AppError.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockCompany = {
  id: 15,
  user_id: 100,
  name: "Algiers Technology Hub",
  is_removed: false,
  created_at: new Date("2026-10-01T10:00:00Z"),
  updated_at: new Date("2026-10-01T10:00:00Z"),
};

const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days

/** A fully-populated draft that satisfies every publish requirement. */
const mockReadyDraft: OpportunityWithRelations = {
  id: 50,
  company_id: 15,
  title: "Junior Backend Developer",
  status: "draft",
  description: "Looking for an energetic junior Node.js developer.",
  type: "job",
  domain_id: 1,
  sub_domain_id: 2,
  registration_deadline: futureDeadline,
  created_at: new Date("2026-10-12T10:00:00Z"),
  updated_at: new Date("2026-10-12T10:00:00Z"),
  domain: { id: 1, name: "Information Technology" },
  sub_domain: { id: 2, name: "Web Development", domain_id: 1 },
  required_skills: [
    {
      id: 1,
      opportunity_id: 50,
      skill_id: 10,
      skill: { id: 10, name: "TypeScript", category_id: 1 },
    },
  ],
  _count: { registrations: 0 },
};

/** Result returned by updateOpportunity after status flip. */
const mockPublishedResult: OpportunityWithRelations = {
  ...mockReadyDraft,
  status: "published",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
    if (typeof callback === "function") {
      return callback(prisma);
    }
    return callback;
  });
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("opportunityService.publish — Phase 13 Slice 4.2", () => {

  // -------------------------------------------------------------------------
  // Company resolution
  // -------------------------------------------------------------------------
  describe("Company resolution", () => {
    it("throws HTTP 404 when no company profile exists for the authenticated user", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(null);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Company profile not found", 404),
      );
    });

    it("throws HTTP 403 when the company account is marked removed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue({
        ...mockCompany,
        is_removed: true,
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Company account has been removed", 403),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Ownership and visibility
  // -------------------------------------------------------------------------
  describe("Ownership and visibility", () => {
    it("throws HTTP 404 when opportunity does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(null);

      await expect(opportunityService.publish(100, 999)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });

    it("throws HTTP 404 when opportunity belongs to a different company (tenant isolation)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany); // id: 15
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        company_id: 99,
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Status lifecycle guard
  // -------------------------------------------------------------------------
  describe("Status lifecycle guard", () => {
    it("throws HTTP 409 Conflict when opportunity is already published", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        status: "published",
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Only draft opportunities can be published", 409),
      );
    });

    it("throws HTTP 409 Conflict when opportunity is closed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        status: "closed",
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Only draft opportunities can be published", 409),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Required attribute validation — each field individually
  // -------------------------------------------------------------------------
  describe("Required attribute validation", () => {
    async function expectMissingFieldError(
      override: Partial<OpportunityWithRelations>,
      expectedMessage: string,
    ) {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        ...override,
      });
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Web Development",
        domain_id: 1,
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError(expectedMessage, 400),
      );
    }

    it("throws HTTP 400 when title is an empty string", async () => {
      await expectMissingFieldError(
        { title: "" },
        "Opportunity must have a title before publishing",
      );
    });

    it("throws HTTP 400 when description is null", async () => {
      await expectMissingFieldError(
        { description: null },
        "Opportunity must have a description before publishing",
      );
    });

    it("throws HTTP 400 when description is empty string", async () => {
      await expectMissingFieldError(
        { description: "" },
        "Opportunity must have a description before publishing",
      );
    });

    it("throws HTTP 400 when type is null", async () => {
      await expectMissingFieldError(
        { type: null },
        "Opportunity must have a type before publishing",
      );
    });

    it("throws HTTP 400 when domain_id is null", async () => {
      await expectMissingFieldError(
        { domain_id: null, domain: null },
        "Opportunity must have a domain before publishing",
      );
    });

    it("throws HTTP 400 when sub_domain_id is null", async () => {
      await expectMissingFieldError(
        { sub_domain_id: null, sub_domain: null },
        "Opportunity must have a sub-domain before publishing",
      );
    });

    it("throws HTTP 400 when required_skills is an empty array (no skills)", async () => {
      await expectMissingFieldError(
        { required_skills: [] },
        "Opportunity must have at least one required skill before publishing",
      );
    });

    it("throws HTTP 400 when registration_deadline is null", async () => {
      await expectMissingFieldError(
        { registration_deadline: null },
        "Opportunity must have a registration deadline before publishing",
      );
    });
  });

  // -------------------------------------------------------------------------
  // Deadline boundary tests
  // -------------------------------------------------------------------------
  describe("Registration deadline boundary tests", () => {
    it("throws HTTP 400 when registration_deadline is in the past", async () => {
      const pastDeadline = new Date(Date.now() - 60_000);
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        registration_deadline: pastDeadline,
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Registration deadline must be strictly later than current server time", 400),
      );
    });

    it("throws HTTP 400 when registration_deadline is a historical past timestamp (deadline < now)", async () => {
      // Uses a fixed historical date (Jan 2020) that is always in the past relative to real
      // execution time. This verifies the `<= now` rejection rule without relying on any
      // clock-control spy, which cannot intercept a local ESM function call.
      const historicalDeadline = new Date("2020-01-01T00:00:00Z");

      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        registration_deadline: historicalDeadline,
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Registration deadline must be strictly later than current server time", 400),
      );
    });


    it("succeeds when registration_deadline is strictly in the future", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        registration_deadline: new Date(Date.now() + 86_400_000),
      });
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Web Development",
        domain_id: 1,
      });
      vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(mockPublishedResult);

      const result = await opportunityService.publish(100, 50);
      expect(result.status).toBe("published");
    });
  });

  // -------------------------------------------------------------------------
  // Taxonomy integrity validation
  // -------------------------------------------------------------------------
  describe("Taxonomy integrity validation", () => {
    it("throws HTTP 400 when the persisted domain_id no longer exists in taxonomy", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockReadyDraft);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue(null);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Selected domain does not exist", 400),
      );
    });

    it("throws HTTP 400 when the persisted sub_domain_id no longer exists in taxonomy", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockReadyDraft);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue(null);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Selected sub-domain does not exist", 400),
      );
    });

    it("throws HTTP 400 when sub_domain does not belong to the persisted domain (mismatch)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        domain_id: 1,
        sub_domain_id: 2,
      });
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Accounting",
        domain_id: 5, // belongs to Finance, not IT
      });

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Sub-domain does not belong to the selected domain", 400),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Successful publication
  // -------------------------------------------------------------------------
  describe("Successful publication", () => {
    function setupHappyPath() {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockReadyDraft);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({
        id: 1,
        name: "Information Technology",
      });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Web Development",
        domain_id: 1,
      });
      return vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockPublishedResult);
    }

    it("transitions the opportunity from draft to published and returns the mapped view", async () => {
      setupHappyPath();

      const result = await opportunityService.publish(100, 50);

      expect(result.status).toBe("published");
      expect(result.id).toBe(50);
      expect(result.company_id).toBe(15);
    });

    it("calls updateOpportunity with status='published' and skillIds=undefined (no skill table touch)", async () => {
      const updateSpy = setupHappyPath();

      await opportunityService.publish(100, 50);

      expect(updateSpy).toHaveBeenCalledWith(
        50,
        expect.objectContaining({ status: "published" }),
        undefined, // skillIds must be undefined
        expect.anything(), // tx
      );
    });

    it("does not expose beneficiary personal data in the response", async () => {
      setupHappyPath();

      const result = await opportunityService.publish(100, 50);

      expect((result as Record<string, unknown>).registrations).toBeUndefined();
      expect((result as Record<string, unknown>).beneficiary).toBeUndefined();
      expect(result.registrations_count).toBeDefined();
    });

    it("uses the row-locking findForUpdate and never calls a plain findById", async () => {
      const findForUpdateSpy = vi
        .spyOn(opportunityRepository, "findForUpdate")
        .mockResolvedValue(mockReadyDraft);
      const findByIdSpy = vi.spyOn(opportunityRepository, "findById");

      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Web Development",
        domain_id: 1,
      });
      vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(mockPublishedResult);

      await opportunityService.publish(100, 50);

      expect(findForUpdateSpy).toHaveBeenCalledWith(50, expect.anything());
      expect(findByIdSpy).not.toHaveBeenCalled();
    });

    it("wraps the entire state check and transition inside a single $transaction call", async () => {
      const txSpy = vi.spyOn(prisma, "$transaction");
      setupHappyPath();

      await opportunityService.publish(100, 50);

      expect(txSpy).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Transaction failure — opportunity remains in draft
  // -------------------------------------------------------------------------
  describe("Transaction failure — opportunity remains in draft", () => {
    it("does not call updateOpportunity when a required attribute validation fails", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        description: null,
      });
      const updateSpy = vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockPublishedResult);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(AppError);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("does not call updateOpportunity when status is not draft", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        status: "published",
      });
      const updateSpy = vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockPublishedResult);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(AppError);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("does not call updateOpportunity when deadline is in the past", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockReadyDraft,
        registration_deadline: new Date(Date.now() - 1000),
      });
      const updateSpy = vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockPublishedResult);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Registration deadline must be strictly later than current server time", 400),
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("does not call updateOpportunity when taxonomy domain/sub-domain mismatch is detected", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockReadyDraft);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Accounting",
        domain_id: 5,
      });
      const updateSpy = vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockPublishedResult);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(
        new AppError("Sub-domain does not belong to the selected domain", 400),
      );
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("propagates unexpected repository errors without swallowing them", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockReadyDraft);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Web Development",
        domain_id: 1,
      });

      const unexpectedError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint violation",
        { code: "P2002", clientVersion: "6.0.0" },
      );
      vi.spyOn(opportunityRepository, "updateOpportunity").mockRejectedValue(unexpectedError);

      await expect(opportunityService.publish(100, 50)).rejects.toThrow(unexpectedError);
    });
  });

  // -------------------------------------------------------------------------
  // repository.findForUpdate — locking correctness (unit)
  // -------------------------------------------------------------------------
  describe("opportunityRepository.findForUpdate — locking behaviour", () => {
    it("issues SELECT ... FOR UPDATE via $queryRaw and then fetches the full opportunity", async () => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: 50 }]),
        opportunities: {
          findUnique: vi.fn().mockResolvedValue(mockReadyDraft),
        },
      } as unknown as Prisma.TransactionClient;

      const opp = await opportunityRepository.findForUpdate(50, mockTx);

      expect(mockTx.$queryRaw).toHaveBeenCalledOnce();
      expect(mockTx.opportunities.findUnique).toHaveBeenCalledWith({
        where: { id: 50 },
        include: expect.any(Object),
      });
      expect(opp).toEqual(mockReadyDraft);
    });

    it("returns null when the opportunity does not exist (findUnique returns null)", async () => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        opportunities: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as Prisma.TransactionClient;

      const opp = await opportunityRepository.findForUpdate(999, mockTx);
      expect(opp).toBeNull();
    });
  });
});
