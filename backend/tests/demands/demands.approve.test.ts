import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../framework/config/prisma.js";
import { demandService } from "../../src/modules/demands/demands.service.js";
import { demandRepository } from "../../src/modules/demands/demands.repository.js";
import { demandNotification } from "../../src/modules/demands/demands.notification.js";
import { cache } from "../../framework/utils/cache.js";
import { storage } from "../../framework/utils/storage.js";
import { hash } from "../../framework/utils/hash.js";
import { AppError } from "../../framework/utils/AppError.js";
import type { Prisma } from "@prisma/client";
import type { SubmitDemandInput } from "../../src/modules/demands/demands.validator.js";

describe("Demand Submission & Approval — Zero-Database Unit Tests", () => {
  const adminId = 1;
  const applicantUserId = 42;
  const demandId = 10;

  type DemandRow = NonNullable<Awaited<ReturnType<typeof demandRepository.findById>>>;

  function createMockDemand(overrides: Partial<DemandRow> = {}): DemandRow {
    return {
      id: demandId,
      user_id: applicantUserId,
      role_id: 3, // Company
      status: "pending",
      applicant_email: "applicant@company.dz",
      applicant_first_name: "Karim",
      applicant_last_name: "Benzema",
      details: { name: "Algeria Tech Corp" },
      reviewed_by: null,
      review_note: null,
      reviewed_at: null,
      decision_notification_sent_at: null,
      account_deleted_at: null,
      created_at: new Date("2026-10-01T10:00:00Z"),
      updated_at: new Date("2026-10-01T10:00:00Z"),
      roles: { id: 3, name: "Company" },
      applicant: {
        id: applicantUserId,
        email: "applicant@company.dz",
        status: "pending",
        profiles: {
          first_name: "Karim",
          last_name: "Benzema",
          phone: "+213555123456",
          avatar: null,
        },
      },
      demand_domains: [],
      documents: [],
      ...overrides,
    } as unknown as DemandRow;
  }

  const mockTx = {
    users: { update: vi.fn() },
    demands: { update: vi.fn() },
    companies: { upsert: vi.fn() },
    organizations: { create: vi.fn() },
    reviewer_domains: { upsert: vi.fn() },
  } as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default transaction executes callback with mockTx
    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(mockTx);
      }
      return callback;
    });

    // Default cache and notification mocks
    vi.spyOn(cache, "del").mockResolvedValue(true as never);
    vi.spyOn(demandNotification, "sendApproved").mockResolvedValue(true);
    vi.spyOn(demandRepository, "markNotificationSent").mockResolvedValue({} as never);
  });

  describe("A. Company Demand Submission & Role Details Isolation", () => {
    const mockFile = {
      fieldname: "files",
      originalname: "license.pdf",
      encoding: "7bit",
      mimetype: "application/pdf",
      size: 1024,
      buffer: Buffer.from("pdf-content"),
    } as Express.Multer.File;

    it("persists company.name in demands.details when submitted with role Company", async () => {
      vi.spyOn(demandRepository, "emailExists").mockResolvedValue(false);
      vi.spyOn(demandRepository, "findRoleByName").mockResolvedValue({ id: 3, name: "Company" });
      vi.spyOn(hash, "password").mockResolvedValue("hashed-secret");

      const createDemandSpy = vi
        .spyOn(demandRepository, "createDemandWithUser")
        .mockResolvedValue({
          user: { id: 50, email: "new@company.dz", status: "pending" },
          demand: { id: 12 },
        } as never);

      vi.spyOn(storage, "upload").mockResolvedValue({
        objectName: "demands/50/uuid.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
      });
      vi.spyOn(demandRepository, "createDocument").mockResolvedValue({
        id: 1,
        name: "license.pdf",
        mime_type: "application/pdf",
        file_size: 1024,
      } as never);

      const input: SubmitDemandInput = {
        role: "Company",
        email: "new@company.dz",
        password: "Password123!",
        first_name: "Yacine",
        last_name: "Brahimi",
        phone: "+213555998877",
        gender: "Male",
        company: { name: "Algérie Cloud Innovations" },
      };

      const result = await demandService.submit(input, [mockFile]);

      expect(createDemandSpy).toHaveBeenCalledTimes(1);
      const passedCreateData = createDemandSpy.mock.calls[0][1];
      expect(passedCreateData.details).toEqual({ name: "Algérie Cloud Innovations" });
      expect(result.demand.id).toBe(12);
      expect(result.demand.role).toBe("Company");
    });

    it("persists undefined details for Company demand when company is omitted", async () => {
      vi.spyOn(demandRepository, "emailExists").mockResolvedValue(false);
      vi.spyOn(demandRepository, "findRoleByName").mockResolvedValue({ id: 3, name: "Company" });
      vi.spyOn(hash, "password").mockResolvedValue("hashed-secret");

      const createDemandSpy = vi
        .spyOn(demandRepository, "createDemandWithUser")
        .mockResolvedValue({
          user: { id: 51, email: "legacy@company.dz", status: "pending" },
          demand: { id: 13 },
        } as never);

      vi.spyOn(storage, "upload").mockResolvedValue({
        objectName: "demands/51/uuid.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
      });
      vi.spyOn(demandRepository, "createDocument").mockResolvedValue({ id: 2 } as never);

      const input: SubmitDemandInput = {
        role: "Company",
        email: "legacy@company.dz",
        password: "Password123!",
        first_name: "Sofiane",
        last_name: "Feghouli",
      };

      await demandService.submit(input, [mockFile]);

      const passedCreateData = createDemandSpy.mock.calls[0][1];
      expect(passedCreateData.details).toBeUndefined();
    });

    it("does not accept or persist company details when role is Reviewer", async () => {
      vi.spyOn(demandRepository, "emailExists").mockResolvedValue(false);
      vi.spyOn(demandRepository, "findRoleByName").mockResolvedValue({ id: 2, name: "Reviewer" });
      vi.spyOn(demandRepository, "findDomainIds").mockResolvedValue([1]);
      vi.spyOn(hash, "password").mockResolvedValue("hashed-secret");

      const createDemandSpy = vi
        .spyOn(demandRepository, "createDemandWithUser")
        .mockResolvedValue({
          user: { id: 52, email: "rev@x.io", status: "pending" },
          demand: { id: 14 },
        } as never);

      vi.spyOn(storage, "upload").mockResolvedValue({
        objectName: "demands/52/uuid.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
      });
      vi.spyOn(demandRepository, "createDocument").mockResolvedValue({ id: 3 } as never);

      const input: SubmitDemandInput = {
        role: "Reviewer",
        email: "rev@x.io",
        password: "Password123!",
        first_name: "Rev",
        last_name: "Iewer",
        domain_ids: [1],
        company: { name: "Should Be Ignored" },
      };

      await demandService.submit(input, [mockFile]);

      const passedCreateData = createDemandSpy.mock.calls[0][1];
      expect(passedCreateData.details).toBeUndefined();
    });

    it("persists organization details and ignores company details when role is Organization", async () => {
      vi.spyOn(demandRepository, "emailExists").mockResolvedValue(false);
      vi.spyOn(demandRepository, "findRoleByName").mockResolvedValue({ id: 4, name: "Organization" });
      vi.spyOn(hash, "password").mockResolvedValue("hashed-secret");

      const createDemandSpy = vi
        .spyOn(demandRepository, "createDemandWithUser")
        .mockResolvedValue({
          user: { id: 53, email: "org@x.io", status: "pending" },
          demand: { id: 15 },
        } as never);

      vi.spyOn(storage, "upload").mockResolvedValue({
        objectName: "demands/53/uuid.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
      });
      vi.spyOn(demandRepository, "createDocument").mockResolvedValue({ id: 4 } as never);

      const input: SubmitDemandInput = {
        role: "Organization",
        email: "org@x.io",
        password: "Password123!",
        first_name: "Org",
        last_name: "Leader",
        organization: { name: "Algeria Red Crescent", location: "Algiers" },
        company: { name: "Unrelated Company Name" },
      };

      await demandService.submit(input, [mockFile]);

      const passedCreateData = createDemandSpy.mock.calls[0][1];
      expect(passedCreateData.details).toEqual({
        name: "Algeria Red Crescent",
        location: "Algiers",
      });
    });
  });

  describe("B. Company Approval & Naming Precedence", () => {
    it("creates exactly one Company record with name from demand.details inside the approval transaction", async () => {
      const mockDemand = createMockDemand({
        details: { name: "Algeria Tech Corp" },
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      const activateUserSpy = vi
        .spyOn(demandRepository, "activateUser")
        .mockResolvedValue({ id: applicantUserId, email: "applicant@company.dz", status: "active" } as never);
      const upsertCompanySpy = vi
        .spyOn(demandRepository, "upsertCompany")
        .mockResolvedValue({ id: 100, user_id: applicantUserId, name: "Algeria Tech Corp" });
      const recordDecisionSpy = vi
        .spyOn(demandRepository, "recordDecision")
        .mockResolvedValue({} as never);
      const cacheDelSpy = vi.spyOn(cache, "del").mockResolvedValue(true as never);
      const notifySpy = vi.spyOn(demandNotification, "sendApproved").mockResolvedValue(true);
      const getByIdSpy = vi
        .spyOn(demandService, "getById")
        .mockResolvedValue({ id: demandId, status: "approved" as const } as never);

      const result = await demandService.approve(demandId, adminId, "Approved after audit");

      expect(activateUserSpy).toHaveBeenCalledWith(mockTx, applicantUserId, 3);
      expect(upsertCompanySpy).toHaveBeenCalledTimes(1);
      expect(upsertCompanySpy).toHaveBeenCalledWith(mockTx, {
        userId: applicantUserId,
        name: "Algeria Tech Corp",
      });
      expect(recordDecisionSpy).toHaveBeenCalledWith(mockTx, {
        demandId,
        status: "approved",
        reviewedBy: adminId,
        note: "Approved after audit",
      });
      expect(cacheDelSpy).toHaveBeenCalledWith(`permissions:user:${applicantUserId}`);
      expect(notifySpy).toHaveBeenCalledWith(mockDemand, "Approved after audit");
      expect(getByIdSpy).toHaveBeenCalledWith(demandId);
      expect(result.status).toBe("approved");
    });

    it("prefers stored company name over Admin-supplied company_name (precedence rule 1)", async () => {
      const mockDemand = createMockDemand({
        details: { name: "Stored Original Authority" },
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);
      const upsertCompanySpy = vi
        .spyOn(demandRepository, "upsertCompany")
        .mockResolvedValue({ id: 101, user_id: applicantUserId, name: "Stored Original Authority" });
      vi.spyOn(demandRepository, "recordDecision").mockResolvedValue({} as never);
      vi.spyOn(demandService, "getById").mockResolvedValue({ id: demandId } as never);

      // Admin attempts to pass an override name
      await demandService.approve(demandId, adminId, "Note", "Admin Override Attempt");

      // Precedence: stored company name MUST take precedence
      expect(upsertCompanySpy).toHaveBeenCalledWith(mockTx, {
        userId: applicantUserId,
        name: "Stored Original Authority",
      });
    });

    it("provisions legacy Company demand using Admin-supplied company_name when stored name is absent (precedence rule 2)", async () => {
      const mockLegacyDemand = createMockDemand({
        details: null, // Legacy demand with no stored name
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockLegacyDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);
      const upsertCompanySpy = vi
        .spyOn(demandRepository, "upsertCompany")
        .mockResolvedValue({ id: 102, user_id: applicantUserId, name: "Admin Verified Telecom" });
      vi.spyOn(demandRepository, "recordDecision").mockResolvedValue({} as never);
      vi.spyOn(demandService, "getById").mockResolvedValue({ id: demandId } as never);

      await demandService.approve(
        demandId,
        adminId,
        "Approved with verified name",
        "Admin Verified Telecom",
      );

      expect(upsertCompanySpy).toHaveBeenCalledWith(mockTx, {
        userId: applicantUserId,
        name: "Admin Verified Telecom",
      });
    });

    it("rejects approval before transaction writes when company name is absent from both demand and Admin input (precedence rule 3)", async () => {
      const mockLegacyDemand = createMockDemand({
        applicant_first_name: "Karim",
        applicant_last_name: "Benzema",
        details: null,
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockLegacyDemand);
      const txSpy = vi.spyOn(prisma, "$transaction");
      const activateUserSpy = vi.spyOn(demandRepository, "activateUser");
      const upsertCompanySpy = vi.spyOn(demandRepository, "upsertCompany");
      const recordDecisionSpy = vi.spyOn(demandRepository, "recordDecision");

      // No company name passed by Admin
      await expect(demandService.approve(demandId, adminId, "Approved")).rejects.toThrow(
        new AppError(
          "Company name is required to approve a Company demand (none stored in demand or provided by reviewer)",
          400,
        ),
      );

      // Verifies rejection occurred BEFORE any transaction writes
      expect(txSpy).not.toHaveBeenCalled();
      expect(activateUserSpy).not.toHaveBeenCalled();
      expect(upsertCompanySpy).not.toHaveBeenCalled();
      expect(recordDecisionSpy).not.toHaveBeenCalled();
    });

    it("rejects approval before transaction writes when Admin passes empty or whitespace-only name for demand without stored details", async () => {
      const mockLegacyDemand = createMockDemand({
        details: null,
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockLegacyDemand);
      const txSpy = vi.spyOn(prisma, "$transaction");

      await expect(
        demandService.approve(demandId, adminId, "Approved", "    "),
      ).rejects.toThrow(AppError);

      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe("C. Uniqueness and Concurrency Handling", () => {
    it("handles pre-existing company record idempotently using upsert without duplicate creation", async () => {
      const mockDemand = createMockDemand({
        details: { name: "Existing Enterprise DZ" },
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);

      const upsertCompanySpy = vi
        .spyOn(demandRepository, "upsertCompany")
        .mockResolvedValue({
          id: 55,
          user_id: applicantUserId,
          name: "Existing Enterprise DZ",
        });

      vi.spyOn(demandRepository, "recordDecision").mockResolvedValue({} as never);
      vi.spyOn(demandService, "getById").mockResolvedValue({ id: demandId } as never);

      const result = await demandService.approve(demandId, adminId);

      expect(upsertCompanySpy).toHaveBeenCalledWith(mockTx, {
        userId: applicantUserId,
        name: "Existing Enterprise DZ",
      });
      expect(result).toBeDefined();
    });

    it("does not hide unrelated database errors under an unsafe catch-all", async () => {
      const mockDemand = createMockDemand({
        details: { name: "Test Corp" },
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);

      const dbError = new Error("Database connection severed during write");
      vi.spyOn(demandRepository, "upsertCompany").mockRejectedValue(dbError);

      await expect(demandService.approve(demandId, adminId)).rejects.toThrow(
        "Database connection severed during write",
      );
    });
  });

  describe("D. Atomic Transaction Rollback on Provisioning Failure", () => {
    it("ensures a failure in company provisioning rolls back user activation and prevents decision recording", async () => {
      const mockDemand = createMockDemand({
        details: { name: "Failing Provision Corp" },
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);

      const provisioningError = new Error("Unique constraint violation or foreign key failure");
      vi.spyOn(demandRepository, "upsertCompany").mockRejectedValue(provisioningError);

      const recordDecisionSpy = vi.spyOn(demandRepository, "recordDecision");
      const cacheDelSpy = vi.spyOn(cache, "del");
      const notifySpy = vi.spyOn(demandNotification, "sendApproved");

      await expect(demandService.approve(demandId, adminId)).rejects.toThrow(provisioningError);

      expect(recordDecisionSpy).not.toHaveBeenCalled();
      expect(cacheDelSpy).not.toHaveBeenCalled();
      expect(notifySpy).not.toHaveBeenCalled();
    });
  });

  describe("E. Owning User, State, and Authorization Guards", () => {
    it("rejects approval with HTTP 400 if demand.user_id is null before initiating transaction writes", async () => {
      const mockDemand = createMockDemand({
        user_id: null,
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      const txSpy = vi.spyOn(prisma, "$transaction");
      const activateUserSpy = vi.spyOn(demandRepository, "activateUser");
      const upsertCompanySpy = vi.spyOn(demandRepository, "upsertCompany");

      await expect(demandService.approve(demandId, adminId)).rejects.toThrow(
        new AppError("Demand has no associated user account", 400),
      );

      expect(txSpy).not.toHaveBeenCalled();
      expect(activateUserSpy).not.toHaveBeenCalled();
      expect(upsertCompanySpy).not.toHaveBeenCalled();
    });

    it("rejects approval with HTTP 409 when demand is already approved", async () => {
      const mockDemand = createMockDemand({
        status: "approved",
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      const txSpy = vi.spyOn(prisma, "$transaction");

      await expect(demandService.approve(demandId, adminId)).rejects.toThrow(
        new AppError("Demand is already reviewed", 409),
      );

      expect(txSpy).not.toHaveBeenCalled();
    });

    it("rejects approval with HTTP 409 when demand is already rejected", async () => {
      const mockDemand = createMockDemand({
        status: "rejected",
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      const txSpy = vi.spyOn(prisma, "$transaction");

      await expect(demandService.approve(demandId, adminId)).rejects.toThrow(
        new AppError("Demand is already reviewed", 409),
      );

      expect(txSpy).not.toHaveBeenCalled();
    });

    it("rejects approval with HTTP 404 when demand does not exist", async () => {
      vi.spyOn(demandRepository, "findById").mockResolvedValue(null);
      const txSpy = vi.spyOn(prisma, "$transaction");

      await expect(demandService.approve(999, adminId)).rejects.toThrow(
        new AppError("Demand not found", 404),
      );

      expect(txSpy).not.toHaveBeenCalled();
    });

    it("rejects approval with HTTP 403 when an admin attempts to review their own demand", async () => {
      const mockDemand = createMockDemand({
        user_id: adminId, // Admin is applicant
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockDemand);
      const txSpy = vi.spyOn(prisma, "$transaction");

      await expect(demandService.approve(demandId, adminId)).rejects.toThrow(
        new AppError("You cannot review your own demand", 403),
      );

      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe("F. Regression — Non-Company Approval Flow Preservation", () => {
    it("preserves Reviewer domain assignment and ignores company_name if passed by Admin", async () => {
      const mockReviewerDemand = createMockDemand({
        role_id: 2,
        roles: { id: 2, name: "Reviewer" },
        demand_domains: [
          { demand_id: demandId, domain_id: 7, domains: { id: 7, name: "Software Development" } },
        ],
        details: null,
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockReviewerDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);
      const assignReviewerDomainSpy = vi
        .spyOn(demandRepository, "assignReviewerDomain")
        .mockResolvedValue({} as never);
      const upsertCompanySpy = vi.spyOn(demandRepository, "upsertCompany");
      const createOrgSpy = vi.spyOn(demandRepository, "createOrganization");
      vi.spyOn(demandRepository, "recordDecision").mockResolvedValue({} as never);
      vi.spyOn(demandService, "getById").mockResolvedValue({ id: demandId } as never);

      // Admin accidentally passed company_name on Reviewer approval
      await demandService.approve(demandId, adminId, "Approved reviewer", "Unrelated Company");

      expect(assignReviewerDomainSpy).toHaveBeenCalledWith(mockTx, applicantUserId, 7);
      expect(upsertCompanySpy).not.toHaveBeenCalled();
      expect(createOrgSpy).not.toHaveBeenCalled();
    });

    it("preserves Organization creation and ignores company_name if passed by Admin", async () => {
      const orgDetails = {
        name: "Jadara Foundation",
        description: "Community empowerment",
        website: "https://jadara.org",
        email: "contact@jadara.org",
        phone: "+213555987654",
        location: "Algiers",
      };

      const mockOrgDemand = createMockDemand({
        role_id: 4,
        roles: { id: 4, name: "Organization" },
        details: orgDetails,
        demand_domains: [],
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockOrgDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);
      vi.spyOn(demandRepository, "findOrganizationByUserId").mockResolvedValue(null);
      const createOrgSpy = vi
        .spyOn(demandRepository, "createOrganization")
        .mockResolvedValue({ id: 200, name: "Jadara Foundation" });
      const upsertCompanySpy = vi.spyOn(demandRepository, "upsertCompany");
      const assignReviewerDomainSpy = vi.spyOn(demandRepository, "assignReviewerDomain");
      vi.spyOn(demandRepository, "recordDecision").mockResolvedValue({} as never);
      vi.spyOn(demandService, "getById").mockResolvedValue({ id: demandId } as never);

      // Admin passed company_name on Organization approval
      await demandService.approve(demandId, adminId, "Approved org", "Ignored Company");

      expect(createOrgSpy).toHaveBeenCalledWith(mockTx, {
        userId: applicantUserId,
        name: "Jadara Foundation",
        email: "contact@jadara.org",
        description: "Community empowerment",
        website: "https://jadara.org",
        phone: "+213555987654",
        location: "Algiers",
      });
      expect(upsertCompanySpy).not.toHaveBeenCalled();
      expect(assignReviewerDomainSpy).not.toHaveBeenCalled();
    });

    it("skips Organization creation if the user already has an organization", async () => {
      const mockOrgDemand = createMockDemand({
        role_id: 4,
        roles: { id: 4, name: "Organization" },
        details: { name: "Existing Org" },
        demand_domains: [],
      });

      vi.spyOn(demandRepository, "findById").mockResolvedValue(mockOrgDemand);
      vi.spyOn(demandRepository, "activateUser").mockResolvedValue({} as never);
      vi.spyOn(demandRepository, "findOrganizationByUserId").mockResolvedValue({
        id: 99,
        name: "Existing Org",
      });
      const createOrgSpy = vi.spyOn(demandRepository, "createOrganization");
      vi.spyOn(demandRepository, "recordDecision").mockResolvedValue({} as never);
      vi.spyOn(demandService, "getById").mockResolvedValue({ id: demandId } as never);

      await demandService.approve(demandId, adminId);

      expect(createOrgSpy).not.toHaveBeenCalled();
    });
  });
});
