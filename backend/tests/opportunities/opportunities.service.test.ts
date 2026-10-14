import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../framework/config/prisma.js";
import { Prisma } from "@prisma/client";
import { opportunityService } from "../../src/modules/opportunities/opportunities.service.js";
import {
  opportunityRepository,
  type OpportunityWithRelations,
} from "../../src/modules/opportunities/opportunities.repository.js";
import { AppError } from "../../framework/utils/AppError.js";

describe("Opportunity Service — Zero-Database Unit Tests", () => {
  const mockCompany = {
    id: 15,
    user_id: 100,
    name: "Algiers Technology Hub",
    is_removed: false,
    created_at: new Date("2026-10-01T10:00:00Z"),
    updated_at: new Date("2026-10-01T10:00:00Z"),
  };

  const mockDraftOpportunity: OpportunityWithRelations = {
    id: 50,
    company_id: 15,
    title: "Junior Backend Developer",
    status: "draft",
    description: "Looking for an energetic junior Node.js developer.",
    type: "job",
    domain_id: 1,
    sub_domain_id: 2,
    registration_deadline: new Date("2026-11-30T23:59:59Z"),
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
      {
        id: 2,
        opportunity_id: 50,
        skill_id: 12,
        skill: { id: 12, name: "PostgreSQL", category_id: 1 },
      },
    ],
    _count: {
      registrations: 0,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return callback;
    });
  });

  describe("Ownership & Active Company Resolution", () => {
    it("throws HTTP 404 when the caller has no associated company record", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(null);

      await expect(
        opportunityService.createDraft(100, { title: "Draft Job" }),
      ).rejects.toThrow(new AppError("Company profile not found", 404));
    });

    it("throws HTTP 403 when the caller's company has is_removed = true", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue({
        ...mockCompany,
        is_removed: true,
      });

      await expect(
        opportunityService.createDraft(100, { title: "Draft Job" }),
      ).rejects.toThrow(new AppError("Company account has been removed", 403));
    });
  });

  describe("createDraft", () => {
    it("successfully creates a draft opportunity with title only", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);

      const minimalDraft: OpportunityWithRelations = {
        ...mockDraftOpportunity,
        id: 51,
        description: null,
        type: null,
        domain_id: null,
        sub_domain_id: null,
        registration_deadline: null,
        domain: null,
        sub_domain: null,
        required_skills: [],
      };

      const createSpy = vi
        .spyOn(opportunityRepository, "createDraft")
        .mockResolvedValue(minimalDraft);

      const result = await opportunityService.createDraft(100, {
        title: "Junior Backend Developer",
      });

      expect(createSpy).toHaveBeenCalledWith(15, {
        title: "Junior Backend Developer",
      });
      expect(result.id).toBe(51);
      expect(result.company_id).toBe(15);
      expect(result.title).toBe("Junior Backend Developer");
      expect(result.status).toBe("draft");
      expect(result.registrations_count).toBe(0);
      expect(result.required_skills).toEqual([]);
    });

    it("successfully creates a full draft opportunity with skills and taxonomy", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({
        id: 1,
        name: "IT",
      });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Web Dev",
        domain_id: 1,
      });
      vi.spyOn(opportunityRepository, "findExistingSkillIds").mockResolvedValue([10, 12]);

      const createSpy = vi
        .spyOn(opportunityRepository, "createDraft")
        .mockResolvedValue(mockDraftOpportunity);

      const result = await opportunityService.createDraft(100, {
        title: "Junior Backend Developer",
        description: "Looking for an energetic junior Node.js developer.",
        type: "job",
        domain_id: 1,
        sub_domain_id: 2,
        registration_deadline: new Date("2026-11-30T23:59:59Z"),
        required_skill_ids: [10, 12],
      });

      expect(createSpy).toHaveBeenCalledWith(15, expect.any(Object));
      expect(result.id).toBe(50);
      expect(result.required_skills).toHaveLength(2);
      expect(result.required_skills[0].name).toBe("TypeScript");
      expect(result.registrations_count).toBe(0);
    });

    it("throws HTTP 400 when specified domain_id does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue(null);

      await expect(
        opportunityService.createDraft(100, {
          title: "Junior Backend Developer",
          domain_id: 999,
        }),
      ).rejects.toThrow(new AppError("Selected domain does not exist", 400));
    });

    it("throws HTTP 400 when specified sub_domain_id does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue(null);

      await expect(
        opportunityService.createDraft(100, {
          title: "Junior Backend Developer",
          sub_domain_id: 888,
        }),
      ).rejects.toThrow(new AppError("Selected sub-domain does not exist", 400));
    });

    it("throws HTTP 400 when sub_domain does not belong to the selected domain", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({
        id: 1,
        name: "IT",
      });
      vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
        id: 2,
        name: "Accounting",
        domain_id: 5, // Belonging to Finance, not IT
      });

      await expect(
        opportunityService.createDraft(100, {
          title: "Junior Backend Developer",
          domain_id: 1,
          sub_domain_id: 2,
        }),
      ).rejects.toThrow(
        new AppError("Sub-domain does not belong to the selected domain", 400),
      );
    });

    it("throws HTTP 400 when required skill IDs do not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findExistingSkillIds").mockResolvedValue([10]); // 99 missing

      await expect(
        opportunityService.createDraft(100, {
          title: "Junior Backend Developer",
          required_skill_ids: [10, 99],
        }),
      ).rejects.toThrow(
        new AppError("Some selected skills do not exist", 400, true, {
          missing_skills: [99],
        }),
      );
    });
  });

  describe("listMine", () => {
    it("lists opportunities strictly scoped to the authenticated company", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);

      const listSpy = vi.spyOn(opportunityRepository, "listOwned").mockResolvedValue({
        items: [mockDraftOpportunity],
        total: 1,
      });

      const result = await opportunityService.listMine(100, {
        page: 1,
        limit: 10,
        status: "draft",
      });

      expect(listSpy).toHaveBeenCalledWith(15, {
        page: 1,
        limit: 10,
        status: "draft",
      });
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].id).toBe(50);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.nextCursor).toBeNull();
    });

    it("does not leak beneficiary personal data in list results", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "listOwned").mockResolvedValue({
        items: [
          {
            ...mockDraftOpportunity,
            _count: { registrations: 3 },
          },
        ],
        total: 1,
      });

      const result = await opportunityService.listMine(100, { page: 1, limit: 10 });
      const item = result.opportunities[0];

      expect(item.registrations_count).toBe(3);
      expect((item as any).registrations).toBeUndefined();
      expect((item as any).beneficiary).toBeUndefined();
    });
  });

  describe("getMineById", () => {
    it("successfully retrieves opportunity owned by the company", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(mockDraftOpportunity);

      const result = await opportunityService.getMineById(100, 50);

      expect(result.id).toBe(50);
      expect(result.company_id).toBe(15);
      expect(result.title).toBe("Junior Backend Developer");
      expect(result.registrations_count).toBe(0);
    });

    it("throws HTTP 404 when opportunity ID does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(null);

      await expect(opportunityService.getMineById(100, 999)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });

    it("throws HTTP 404 when opportunity belongs to a different company (tenant isolation)", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany); // Company 15
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...mockDraftOpportunity,
        company_id: 99, // Another company
      });

      await expect(opportunityService.getMineById(100, 50)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });
  });

  describe("deleteDraft", () => {
    it("successfully deletes draft opportunity when status is draft and registrations count is 0", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(mockDraftOpportunity);
      const deleteSpy = vi
        .spyOn(opportunityRepository, "deleteDraft")
        .mockResolvedValue(1);

      await opportunityService.deleteDraft(100, 50);

      expect(deleteSpy).toHaveBeenCalledWith(15, 50);
    });

    it("throws HTTP 404 when deleting a non-existent opportunity", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(null);

      await expect(opportunityService.deleteDraft(100, 999)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });

    it("throws HTTP 404 when deleting an opportunity owned by another company", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany); // Company 15
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...mockDraftOpportunity,
        company_id: 88,
      });

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });

    it("throws HTTP 409 Conflict when attempting to delete a published opportunity", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...mockDraftOpportunity,
        status: "published",
      });

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Only draft opportunities can be deleted", 409),
      );
    });

    it("throws HTTP 409 Conflict when attempting to delete a closed opportunity", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...mockDraftOpportunity,
        status: "closed",
      });

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Only draft opportunities can be deleted", 409),
      );
    });

    it("throws HTTP 409 Conflict when attempting to delete an opportunity with existing registrations", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue({
        ...mockDraftOpportunity,
        status: "draft",
        _count: { registrations: 2 },
      });

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Cannot delete opportunity with existing registrations", 409),
      );
    });

    it("prevents TOCTOU race: throws HTTP 409 Conflict when opportunity was concurrently published before delete", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);

      // First call sees draft; deleteDraft affects 0 rows; second call sees published
      vi.spyOn(opportunityRepository, "findById")
        .mockResolvedValueOnce(mockDraftOpportunity) // First read: draft
        .mockResolvedValueOnce({
          ...mockDraftOpportunity,
          status: "published", // Concurrent update: published
        });

      vi.spyOn(opportunityRepository, "deleteDraft").mockResolvedValue(0);

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Only draft opportunities can be deleted", 409),
      );
    });

    it("prevents TOCTOU race: throws HTTP 409 Conflict when opportunity received concurrent registration before delete", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);

      // First call sees 0 registrations; deleteDraft affects 0 rows; second call sees 1 registration
      vi.spyOn(opportunityRepository, "findById")
        .mockResolvedValueOnce(mockDraftOpportunity)
        .mockResolvedValueOnce({
          ...mockDraftOpportunity,
          _count: { registrations: 1 },
        });

      vi.spyOn(opportunityRepository, "deleteDraft").mockResolvedValue(0);

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Cannot delete opportunity with existing registrations", 409),
      );
    });

    it("prevents TOCTOU race: throws HTTP 404 when opportunity was concurrently deleted by another request", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);

      // First call sees draft; deleteDraft affects 0 rows; second call sees null
      vi.spyOn(opportunityRepository, "findById")
        .mockResolvedValueOnce(mockDraftOpportunity)
        .mockResolvedValueOnce(null);

      vi.spyOn(opportunityRepository, "deleteDraft").mockResolvedValue(0);

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Opportunity not found", 404),
      );
    });

    it("propagates HTTP 409 when repository deleteDraft encounters P2003 foreign key constraint violation", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findById").mockResolvedValue(mockDraftOpportunity);
      vi.spyOn(opportunityRepository, "deleteDraft").mockRejectedValue(
        new AppError("Cannot delete opportunity with existing registrations", 409),
      );

      await expect(opportunityService.deleteDraft(100, 50)).rejects.toThrow(
        new AppError("Cannot delete opportunity with existing registrations", 409),
      );
    });
  });

  describe("opportunityRepository.deleteDraft — Concurrency & Error Mapping Unit Tests", () => {
    it("executes atomic deleteMany with strict company, draft status, and zero-registrations criteria", async () => {
      const deleteManySpy = vi
        .spyOn(prisma.opportunities, "deleteMany")
        .mockResolvedValue({ count: 1 });

      const count = await opportunityRepository.deleteDraft(15, 50);

      expect(count).toBe(1);
      expect(deleteManySpy).toHaveBeenCalledWith({
        where: {
          id: 50,
          company_id: 15,
          status: "draft",
          registrations: { none: {} },
        },
      });
    });

    it("catches Prisma P2003 foreign key constraint violation and maps to controlled HTTP 409 AppError", async () => {
      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed on the field: opportunity_id",
        {
          code: "P2003",
          clientVersion: "6.0.0",
        },
      );

      vi.spyOn(prisma.opportunities, "deleteMany").mockRejectedValue(p2003Error);

      await expect(opportunityRepository.deleteDraft(15, 50)).rejects.toThrow(
        new AppError("Cannot delete opportunity with existing registrations", 409),
      );
    });

    it("does not swallow unrelated Prisma errors or exceptions", async () => {
      const otherError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "6.0.0",
        },
      );

      vi.spyOn(prisma.opportunities, "deleteMany").mockRejectedValue(otherError);

      await expect(opportunityRepository.deleteDraft(15, 50)).rejects.toThrow(
        otherError,
      );
    });
  });

  describe("update — Business Rules & Lifecycle Invariants", () => {
    it("throws HTTP 404 when company profile does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(null);

      await expect(
        opportunityService.update(100, 50, { title: "New Title" }),
      ).rejects.toThrow(new AppError("Company profile not found", 404));
    });

    it("throws HTTP 403 when company is marked as removed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue({
        ...mockCompany,
        is_removed: true,
      });

      await expect(
        opportunityService.update(100, 50, { title: "New Title" }),
      ).rejects.toThrow(new AppError("Company account has been removed", 403));
    });

    it("throws HTTP 404 when opportunity does not exist", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(null);

      await expect(
        opportunityService.update(100, 999, { title: "New Title" }),
      ).rejects.toThrow(new AppError("Opportunity not found", 404));
    });

    it("throws HTTP 404 when opportunity is owned by another company", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraftOpportunity,
        company_id: 99,
      });

      await expect(
        opportunityService.update(100, 50, { title: "New Title" }),
      ).rejects.toThrow(new AppError("Opportunity not found", 404));
    });

    it("throws HTTP 409 Conflict when opportunity status is closed", async () => {
      vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
      vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue({
        ...mockDraftOpportunity,
        status: "closed",
      });

      await expect(
        opportunityService.update(100, 50, { title: "New Title" }),
      ).rejects.toThrow(new AppError("Closed opportunities cannot be updated", 409));
    });

    describe("Before first registration (registrations_count === 0)", () => {
      it("successfully updates all permitted fields", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);
        vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 2, name: "Design" });
        vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
          id: 5,
          name: "UI/UX",
          domain_id: 2,
        });
        vi.spyOn(opportunityRepository, "findExistingSkillIds").mockResolvedValue([20, 21]);

        const updatedRow: OpportunityWithRelations = {
          ...mockDraftOpportunity,
          title: "Lead Product Designer",
          description: "Leading all product design.",
          type: "internship",
          domain_id: 2,
          sub_domain_id: 5,
          registration_deadline: new Date("2026-12-31T23:59:59Z"),
          domain: { id: 2, name: "Design" },
          sub_domain: { id: 5, name: "UI/UX", domain_id: 2 },
          required_skills: [
            { id: 3, opportunity_id: 50, skill_id: 20, skill: { id: 20, name: "Figma", category_id: 2 } },
            { id: 4, opportunity_id: 50, skill_id: 21, skill: { id: 21, name: "Wireframing", category_id: 2 } },
          ],
        };

        const updateSpy = vi
          .spyOn(opportunityRepository, "updateOpportunity")
          .mockResolvedValue(updatedRow);

        const result = await opportunityService.update(100, 50, {
          title: "Lead Product Designer",
          description: "Leading all product design.",
          type: "internship",
          domain_id: 2,
          sub_domain_id: 5,
          registration_deadline: new Date("2026-12-31T23:59:59Z"),
          required_skill_ids: [20, 21],
        });

        expect(result.title).toBe("Lead Product Designer");
        expect(result.type).toBe("internship");
        expect(result.domain_id).toBe(2);
        expect(result.sub_domain_id).toBe(5);
        expect(result.required_skills).toHaveLength(2);
        expect(updateSpy).toHaveBeenCalledWith(
          50,
          expect.objectContaining({
            title: "Lead Product Designer",
            description: "Leading all product design.",
            type: "internship",
            domain_id: 2,
            sub_domain_id: 5,
          }),
          [20, 21],
          expect.anything(),
        );
      });

      it("throws HTTP 400 when referenced domain_id does not exist", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);
        vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue(null);

        await expect(
          opportunityService.update(100, 50, { domain_id: 999 }),
        ).rejects.toThrow(new AppError("Selected domain does not exist", 400));
      });

      it("throws HTTP 400 when referenced sub_domain_id does not exist", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);
        vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue(null);

        await expect(
          opportunityService.update(100, 50, { sub_domain_id: 999 }),
        ).rejects.toThrow(new AppError("Selected sub-domain does not exist", 400));
      });

      it("throws HTTP 400 when sub_domain_id does not belong to supplied domain_id", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);
        vi.spyOn(opportunityRepository, "findDomainById").mockResolvedValue({ id: 1, name: "IT" });
        vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
          id: 5,
          name: "UI/UX",
          domain_id: 2,
        });

        await expect(
          opportunityService.update(100, 50, { domain_id: 1, sub_domain_id: 5 }),
        ).rejects.toThrow(
          new AppError("Sub-domain does not belong to the selected domain", 400),
        );
      });

      it("throws HTTP 400 when sub_domain_id does not belong to existing opportunity domain_id", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);
        vi.spyOn(opportunityRepository, "findSubDomainById").mockResolvedValue({
          id: 5,
          name: "UI/UX",
          domain_id: 2,
        });

        await expect(
          opportunityService.update(100, 50, { sub_domain_id: 5 }),
        ).rejects.toThrow(
          new AppError("Sub-domain does not belong to the selected domain", 400),
        );
      });

      it("throws HTTP 400 when any supplied skill does not exist", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);
        vi.spyOn(opportunityRepository, "findExistingSkillIds").mockResolvedValue([10]);

        await expect(
          opportunityService.update(100, 50, { required_skill_ids: [10, 999] }),
        ).rejects.toThrow(
          new AppError("Some selected skills do not exist", 400, true, {
            missing_skills: [999],
          }),
        );
      });

      it("allows clearing nullable fields with null and required_skills with []", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockDraftOpportunity);

        const clearedRow: OpportunityWithRelations = {
          ...mockDraftOpportunity,
          description: null,
          type: null,
          domain_id: null,
          sub_domain_id: null,
          domain: null,
          sub_domain: null,
          registration_deadline: null,
          required_skills: [],
        };

        const updateSpy = vi
          .spyOn(opportunityRepository, "updateOpportunity")
          .mockResolvedValue(clearedRow);

        const result = await opportunityService.update(100, 50, {
          description: null,
          type: null,
          domain_id: null,
          sub_domain_id: null,
          registration_deadline: null,
          required_skill_ids: [],
        });

        expect(result.description).toBeNull();
        expect(result.type).toBeNull();
        expect(result.domain_id).toBeNull();
        expect(result.sub_domain_id).toBeNull();
        expect(result.required_skills).toHaveLength(0);
        expect(updateSpy).toHaveBeenCalledWith(
          50,
          expect.objectContaining({
            description: null,
            type: null,
            domain_id: null,
            sub_domain_id: null,
            registration_deadline: null,
          }),
          [],
          expect.anything(),
        );
      });
    });

    describe("Once at least one registration exists (registrations_count > 0)", () => {
      const mockRegisteredOpportunity: OpportunityWithRelations = {
        ...mockDraftOpportunity,
        status: "published",
        _count: {
          registrations: 3,
        },
      };

      it("freezes type: throws HTTP 409 Conflict when attempting to modify type", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        await expect(
          opportunityService.update(100, 50, { type: "internship" }),
        ).rejects.toThrow(
          new AppError(
            "Cannot modify frozen fields (type, domain, sub-domain, required skills) after registrations exist",
            409,
          ),
        );
      });

      it("freezes domain_id: throws HTTP 409 Conflict when attempting to modify domain_id", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        await expect(
          opportunityService.update(100, 50, { domain_id: 2 }),
        ).rejects.toThrow(
          new AppError(
            "Cannot modify frozen fields (type, domain, sub-domain, required skills) after registrations exist",
            409,
          ),
        );
      });

      it("freezes sub_domain_id: throws HTTP 409 Conflict when attempting to modify sub_domain_id", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        await expect(
          opportunityService.update(100, 50, { sub_domain_id: 3 }),
        ).rejects.toThrow(
          new AppError(
            "Cannot modify frozen fields (type, domain, sub-domain, required skills) after registrations exist",
            409,
          ),
        );
      });

      it("freezes required_skill_ids: throws HTTP 409 Conflict when attempting to modify required_skill_ids", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        await expect(
          opportunityService.update(100, 50, { required_skill_ids: [10, 11] }),
        ).rejects.toThrow(
          new AppError(
            "Cannot modify frozen fields (type, domain, sub-domain, required skills) after registrations exist",
            409,
          ),
        );
      });

      it("freezes fields even if registrations are anonymous (beneficiary deleted)", async () => {
        const anonymousRegistrationsOpp: OpportunityWithRelations = {
          ...mockDraftOpportunity,
          status: "published",
          _count: {
            registrations: 1,
          },
        };

        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(anonymousRegistrationsOpp);

        await expect(
          opportunityService.update(100, 50, { type: "internship" }),
        ).rejects.toThrow(
          new AppError(
            "Cannot modify frozen fields (type, domain, sub-domain, required skills) after registrations exist",
            409,
          ),
        );
      });

      it("allows modifying title and description after registrations exist", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        const updatedRow: OpportunityWithRelations = {
          ...mockRegisteredOpportunity,
          title: "Updated Senior Developer",
          description: "Updated job description.",
        };

        vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(updatedRow);

        const result = await opportunityService.update(100, 50, {
          title: "Updated Senior Developer",
          description: "Updated job description.",
        });

        expect(result.title).toBe("Updated Senior Developer");
        expect(result.description).toBe("Updated job description.");
        expect(result.registrations_count).toBe(3);
      });

      it("allows extending registration_deadline strictly in the future", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const updatedRow: OpportunityWithRelations = {
          ...mockRegisteredOpportunity,
          registration_deadline: futureDate,
        };

        vi.spyOn(opportunityRepository, "updateOpportunity").mockResolvedValue(updatedRow);

        const result = await opportunityService.update(100, 50, {
          registration_deadline: futureDate,
        });

        expect(result.registration_deadline).toEqual(futureDate);
      });

      it("rejects deadline change when new deadline is in the past", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        const pastDate = new Date(Date.now() - 10000);

        await expect(
          opportunityService.update(100, 50, { registration_deadline: pastDate }),
        ).rejects.toThrow(
          new AppError(
            "Registration deadline must be strictly later than current server time",
            400,
          ),
        );
      });

      it("rejects clearing deadline (null) once registrations exist", async () => {
        vi.spyOn(opportunityRepository, "findCompanyByUserId").mockResolvedValue(mockCompany);
        vi.spyOn(opportunityRepository, "findForUpdate").mockResolvedValue(mockRegisteredOpportunity);

        await expect(
          opportunityService.update(100, 50, { registration_deadline: null }),
        ).rejects.toThrow(
          new AppError(
            "Registration deadline must be strictly later than current server time",
            400,
          ),
        );
      });
    });
  });

  describe("opportunityRepository.findForUpdate & updateOpportunity — Concurrency & Persistence", () => {
    it("findForUpdate executes SELECT ... FOR UPDATE and queries unique opportunity inside transaction", async () => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: 50 }]),
        opportunities: {
          findUnique: vi.fn().mockResolvedValue(mockDraftOpportunity),
        },
      } as unknown as Prisma.TransactionClient;

      const opp = await opportunityRepository.findForUpdate(50, mockTx);

      expect(opp).toEqual(mockDraftOpportunity);
      expect(mockTx.$queryRaw).toHaveBeenCalled();
      expect(mockTx.opportunities.findUnique).toHaveBeenCalledWith({
        where: { id: 50 },
        include: expect.any(Object),
      });
    });

    it("updateOpportunity synchronizes required skills join table when skillIds is provided", async () => {
      const mockTx = {
        opportunity_required_skills: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        opportunities: {
          update: vi.fn().mockResolvedValue(mockDraftOpportunity),
        },
      } as unknown as Prisma.TransactionClient;

      await opportunityRepository.updateOpportunity(
        50,
        { title: "Updated Title" },
        [10, 12],
        mockTx,
      );

      expect(mockTx.opportunity_required_skills.deleteMany).toHaveBeenCalledWith({
        where: { opportunity_id: 50 },
      });
      expect(mockTx.opportunity_required_skills.createMany).toHaveBeenCalledWith({
        data: [
          { opportunity_id: 50, skill_id: 10 },
          { opportunity_id: 50, skill_id: 12 },
        ],
      });
      expect(mockTx.opportunities.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: { title: "Updated Title" },
        include: expect.any(Object),
      });
    });

    it("updateOpportunity deletes existing skills and creates none when skillIds is empty array", async () => {
      const mockTx = {
        opportunity_required_skills: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          createMany: vi.fn(),
        },
        opportunities: {
          update: vi.fn().mockResolvedValue(mockDraftOpportunity),
        },
      } as unknown as Prisma.TransactionClient;

      await opportunityRepository.updateOpportunity(
        50,
        { title: "Updated Title" },
        [],
        mockTx,
      );

      expect(mockTx.opportunity_required_skills.deleteMany).toHaveBeenCalledWith({
        where: { opportunity_id: 50 },
      });
      expect(mockTx.opportunity_required_skills.createMany).not.toHaveBeenCalled();
    });

    it("updateOpportunity does not touch skills join table when skillIds is undefined", async () => {
      const mockTx = {
        opportunity_required_skills: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
        opportunities: {
          update: vi.fn().mockResolvedValue(mockDraftOpportunity),
        },
      } as unknown as Prisma.TransactionClient;

      await opportunityRepository.updateOpportunity(
        50,
        { title: "Updated Title" },
        undefined,
        mockTx,
      );

      expect(mockTx.opportunity_required_skills.deleteMany).not.toHaveBeenCalled();
      expect(mockTx.opportunity_required_skills.createMany).not.toHaveBeenCalled();
      expect(mockTx.opportunities.update).toHaveBeenCalled();
    });
  });
});
