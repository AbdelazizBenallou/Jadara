import { describe, it, expect, vi, beforeEach } from "vitest";
import { companyService } from "../../src/modules/companies/companies.service.js";
import { companyRepository } from "../../src/modules/companies/companies.repository.js";
import { AppError } from "../../framework/utils/AppError.js";

describe("Company Profile Service — Zero-Database Unit Tests", () => {
  const mockCompany = {
    id: 10,
    user_id: 42,
    name: "Algeria Tech Innovations",
    is_removed: false,
    created_at: new Date("2026-10-01T10:00:00Z"),
    updated_at: new Date("2026-10-01T10:00:00Z"),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getMine", () => {
    it("successfully retrieves company profile for the authenticated user", async () => {
      const findByUserIdSpy = vi
        .spyOn(companyRepository, "findByUserId")
        .mockResolvedValue(mockCompany);

      const result = await companyService.getMine(42);

      expect(findByUserIdSpy).toHaveBeenCalledTimes(1);
      expect(findByUserIdSpy).toHaveBeenCalledWith(42);
      expect(result).toEqual(mockCompany);
      expect(result.id).toBe(10);
      expect(result.name).toBe("Algeria Tech Innovations");
    });

    it("throws HTTP 404 when no company record exists for the user", async () => {
      const findByUserIdSpy = vi
        .spyOn(companyRepository, "findByUserId")
        .mockResolvedValue(null);

      await expect(companyService.getMine(999)).rejects.toThrow(
        new AppError("Company profile not found", 404),
      );

      expect(findByUserIdSpy).toHaveBeenCalledWith(999);
    });

    it("does not create a company record automatically when missing", async () => {
      vi.spyOn(companyRepository, "findByUserId").mockResolvedValue(null);
      const updateByUserIdSpy = vi.spyOn(companyRepository, "updateByUserId");

      await expect(companyService.getMine(123)).rejects.toThrow(AppError);

      expect(updateByUserIdSpy).not.toHaveBeenCalled();
    });

    it("throws HTTP 403 when the company record has is_removed = true", async () => {
      const removedCompany = {
        ...mockCompany,
        is_removed: true,
      };

      vi.spyOn(companyRepository, "findByUserId").mockResolvedValue(removedCompany);

      await expect(companyService.getMine(42)).rejects.toThrow(
        new AppError("Company account has been removed", 403),
      );
    });

    it("strictly scopes retrieval to the authenticated user ID", async () => {
      const findByUserIdSpy = vi
        .spyOn(companyRepository, "findByUserId")
        .mockResolvedValue(mockCompany);

      const callingUserId = 77;
      await companyService.getMine(callingUserId);

      // Caller cannot query or receive another user's company
      expect(findByUserIdSpy).toHaveBeenCalledWith(77);
      expect(findByUserIdSpy).not.toHaveBeenCalledWith(10); // Not company.id
    });
  });

  describe("updateMine", () => {
    it("successfully updates company name for the authenticated user", async () => {
      const updatedCompany = {
        ...mockCompany,
        name: "Updated Enterprise Solutions",
        updated_at: new Date("2026-10-12T12:00:00Z"),
      };

      const findByUserIdSpy = vi
        .spyOn(companyRepository, "findByUserId")
        .mockResolvedValue(mockCompany);

      const updateByUserIdSpy = vi
        .spyOn(companyRepository, "updateByUserId")
        .mockResolvedValue(updatedCompany);

      const result = await companyService.updateMine(42, {
        name: "Updated Enterprise Solutions",
      });

      expect(findByUserIdSpy).toHaveBeenCalledWith(42);
      expect(updateByUserIdSpy).toHaveBeenCalledWith(42, {
        name: "Updated Enterprise Solutions",
      });
      expect(result.name).toBe("Updated Enterprise Solutions");
    });

    it("throws HTTP 404 when attempting to update a non-existent company record", async () => {
      vi.spyOn(companyRepository, "findByUserId").mockResolvedValue(null);
      const updateByUserIdSpy = vi.spyOn(companyRepository, "updateByUserId");

      await expect(
        companyService.updateMine(999, { name: "Non-existent Corp" }),
      ).rejects.toThrow(new AppError("Company profile not found", 404));

      expect(updateByUserIdSpy).not.toHaveBeenCalled();
    });

    it("throws HTTP 403 and rejects updates to removed company accounts", async () => {
      const removedCompany = {
        ...mockCompany,
        is_removed: true,
      };

      vi.spyOn(companyRepository, "findByUserId").mockResolvedValue(removedCompany);
      const updateByUserIdSpy = vi.spyOn(companyRepository, "updateByUserId");

      await expect(
        companyService.updateMine(42, { name: "Attempted Name Change" }),
      ).rejects.toThrow(new AppError("Company account has been removed", 403));

      expect(updateByUserIdSpy).not.toHaveBeenCalled();
    });

    it("guarantees only name is passed to repository update, protecting immutable fields", async () => {
      vi.spyOn(companyRepository, "findByUserId").mockResolvedValue(mockCompany);
      const updateByUserIdSpy = vi
        .spyOn(companyRepository, "updateByUserId")
        .mockResolvedValue({ ...mockCompany, name: "Legit Name" });

      // Simulate a payload that somehow carried extra/immutable fields
      const maliciousPayload = {
        name: "Legit Name",
        id: 999,
        user_id: 1,
        is_removed: false,
      } as unknown as { name: string };

      await companyService.updateMine(42, maliciousPayload);

      // Verify repository only received { name: 'Legit Name' }
      expect(updateByUserIdSpy).toHaveBeenCalledWith(42, {
        name: "Legit Name",
      });
      const passedData = updateByUserIdSpy.mock.calls[0][1];
      expect(passedData).toEqual({ name: "Legit Name" });
      expect((passedData as Record<string, unknown>).id).toBeUndefined();
      expect((passedData as Record<string, unknown>).user_id).toBeUndefined();
      expect((passedData as Record<string, unknown>).is_removed).toBeUndefined();
    });
  });
});
