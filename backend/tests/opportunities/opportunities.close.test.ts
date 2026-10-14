/**
 * Phase 13 — Slice 4.3: Close Opportunity
 * Database-free unit tests for opportunityService.close.
 *
 * Approved decisions under test:
 *  - draft  → closed : permitted (200)
 *  - published → closed : permitted (200)
 *  - closed → closed : rejected (409)
 *  - No deadline rule applies to closing
 *  - Skills and registrations are never modified
 *  - Ownership and removed-company checks match existing conventions
 *  - SELECT ... FOR UPDATE row lock via findForUpdate inside $transaction
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
  id: 20,
  user_id: 200,
  name: "Oran Ventures SPA",
  is_removed: false,
  created_at: new Date("2026-10-01T08:00:00Z"),
  updated_at: new Date("2026-10-01T08:00:00Z"),
};

const futureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 days

/** A fully-populated draft that can be closed without any attribute validation. */
const mockDraft: OpportunityWithRelations = {
  id: 60,
  company_id: 20,
  title: "Data Engineer",
  status: "draft",
  description: "Seeking a skilled data engineer.",
  type: "job",
  domain_id: 3,
  sub_domain_id: 7,
  registration_deadline: futureDeadline,
  created_at: new Date("2026-10-13T09:00:00Z"),
  updated_at: new Date("2026-10-13T09:00:00Z"),
  domain: { id: 3, name: "Data Science & AI" },
  sub_domain: { id: 7, name: "Machine Learning", domain_id: 3 },
  required_skills: [
    {
      id: 5,
      opportunity_id: 60,
      skill_id: 14,
      skill: { id: 14, name: "Python", category_id: 1 },
    },
  ],
  _count: { registrations: 2 }, // has existing registrations — must be preserved
};

const mockPublished: OpportunityWithRelations = {
  ...mockDraft,
  status: "published",
};

/** What the repository returns after the status flip. */
const mockClosedResult: OpportunityWithRelations = {
  ...mockDraft,
  status: "closed",
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

describe("opportunityService.close — Phase 13 Slice 4.3", () => {

  // -------------------------------------------------------------------------
  // Company resolution
  // -------------------------------------------------------------------------
  describe("Company resolution", () => {
    it("throws HTTP 404 when no company profile exists for the authenticated user", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(null);

      await expect(opportunityService.close(200, 60)).rejects.toThrow(
        new AppError("Company profile not found", 404),
      );
    });

    it("throws HTTP 403 when the company account is marked removed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue({
        ...mockCompany,
        is_removed: true,
      });

      await expect(opportunityService.close(200, 60)).rejects.toThrow(
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

      await expect(opportunityService.close(200, 999)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });

    it("throws HTTP 404 when opportunity belongs to a different company (tenant isolation)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany); // id: 20
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraft,
        company_id: 99, // different company
      });

      await expect(opportunityService.close(200, 60)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });
  });

  // -------------------------------------------------------------------------
  // State guard — already closed
  // -------------------------------------------------------------------------
  describe("State guard — already closed", () => {
    it("throws HTTP 409 Conflict when the opportunity is already closed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraft,
        status: "closed",
      });

      await expect(opportunityService.close(200, 60)).rejects.toThrow(
        new AppError("Opportunity is already closed", 409),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — draft → closed
  // -------------------------------------------------------------------------
  describe("Happy path — draft → closed", () => {
    function setupDraftClose() {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraft);
      return vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockClosedResult);
    }

    it("transitions a draft opportunity to closed and returns the mapped view", async () => {
      setupDraftClose();

      const result = await opportunityService.close(200, 60);

      expect(result.status).toBe("closed");
      expect(result.id).toBe(60);
      expect(result.company_id).toBe(20);
    });

    it("calls updateOpportunity with status='closed' and skillIds=undefined (no skill table touch)", async () => {
      const updateSpy = setupDraftClose();

      await opportunityService.close(200, 60);

      expect(updateSpy).toHaveBeenCalledWith(
        60,
        expect.objectContaining({ status: "closed" }),
        undefined, // skillIds must be undefined — skills join table is never touched
        expect.anything(), // tx
      );
    });

    it("preserves registrations — does not touch the registrations table", async () => {
      setupDraftClose();
      const deleteManySpy = vi.spyOn(prisma.opportunity_registrations, "deleteMany");

      await opportunityService.close(200, 60);

      expect(deleteManySpy).not.toHaveBeenCalled();
    });

    it("does not expose beneficiary personal data in the response", async () => {
      setupDraftClose();

      const result = await opportunityService.close(200, 60);

      expect((result as Record<string, unknown>).registrations).toBeUndefined();
      expect((result as Record<string, unknown>).beneficiary).toBeUndefined();
      expect(result.registrations_count).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — published → closed
  // -------------------------------------------------------------------------
  describe("Happy path — published → closed", () => {
    function setupPublishedClose() {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockPublished);
      return vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockClosedResult);
    }

    it("transitions a published opportunity to closed and returns the mapped view", async () => {
      setupPublishedClose();

      const result = await opportunityService.close(200, 60);

      expect(result.status).toBe("closed");
    });

    it("calls updateOpportunity with status='closed' and skillIds=undefined", async () => {
      const updateSpy = setupPublishedClose();

      await opportunityService.close(200, 60);

      expect(updateSpy).toHaveBeenCalledWith(
        60,
        expect.objectContaining({ status: "closed" }),
        undefined,
        expect.anything(),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Deadline is irrelevant to closing
  // -------------------------------------------------------------------------
  describe("Deadline independence", () => {
    it("closes an opportunity with a past registration_deadline without error", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockPublished,
        registration_deadline: new Date("2020-01-01T00:00:00Z"), // far in the past
      });
      vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(mockClosedResult);

      const result = await opportunityService.close(200, 60);
      expect(result.status).toBe("closed");
    });

    it("closes an opportunity with a null registration_deadline without error", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraft,
        registration_deadline: null,
      });
      vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(mockClosedResult);

      const result = await opportunityService.close(200, 60);
      expect(result.status).toBe("closed");
    });
  });

  // -------------------------------------------------------------------------
  // Concurrency / transaction guarantees
  // -------------------------------------------------------------------------
  describe("Concurrency and transaction guarantees", () => {
    it("wraps the entire state check and status transition inside a single $transaction call", async () => {
      const txSpy = vi.spyOn(prisma, "$transaction");
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraft);
      vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(mockClosedResult);

      await opportunityService.close(200, 60);

      expect(txSpy).toHaveBeenCalledOnce();
    });

    it("uses the row-locking findForUpdate and never calls a plain findById", async () => {
      const findForUpdateSpy = vi
        .spyOn(opportunityRepository, "findForUpdate")
        .mockResolvedValue(mockDraft);
      const findByIdSpy = vi.spyOn(opportunityRepository, "findById");

      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(mockClosedResult);

      await opportunityService.close(200, 60);

      expect(findForUpdateSpy).toHaveBeenCalledWith(60, expect.anything());
      expect(findByIdSpy).not.toHaveBeenCalled();
    });

    it("does not call updateOpportunity when the opportunity is already closed (transaction aborts)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraft,
        status: "closed",
      });
      const updateSpy = vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockClosedResult);

      await expect(opportunityService.close(200, 60)).rejects.toThrow(AppError);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("does not call updateOpportunity when company ownership check fails", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraft,
        company_id: 99,
      });
      const updateSpy = vi
        .spyOn(opportunityRepository, "updateOpportunity")
        .mockResolvedValue(mockClosedResult);

      await expect(opportunityService.close(200, 60)).rejects.toThrow(AppError);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("propagates unexpected repository errors without swallowing them", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraft);

      const unexpectedError = new Prisma.PrismaClientKnownRequestError(
        "Deadlock detected",
        { code: "P2034", clientVersion: "6.0.0" },
      );
      vi.spyOn(opportunityRepository, "updateOpportunity").mockRejectedValue(unexpectedError);

      await expect(opportunityService.close(200, 60)).rejects.toThrow(unexpectedError);
    });
  });

  // -------------------------------------------------------------------------
  // opportunityRepository.findForUpdate — locking correctness (unit)
  // -------------------------------------------------------------------------
  describe("opportunityRepository.findForUpdate — locking behaviour (close context)", () => {
    it("issues SELECT ... FOR UPDATE via $queryRaw and then fetches the full opportunity", async () => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: 60 }]),
        opportunities: {
          findUnique: vi.fn().mockResolvedValue(mockDraft),
        },
      } as unknown as Prisma.TransactionClient;

      const opp = await opportunityRepository.findForUpdate(60, mockTx);

      expect(mockTx.$queryRaw).toHaveBeenCalledOnce();
      expect(mockTx.opportunities.findUnique).toHaveBeenCalledWith({
        where: { id: 60 },
        include: expect.any(Object),
      });
      expect(opp).toEqual(mockDraft);
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
