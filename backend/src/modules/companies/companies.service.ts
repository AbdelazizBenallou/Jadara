import { AppError } from "../../../framework/utils/AppError.js";
import { companyRepository } from "./companies.repository.js";
import type { UpdateCompanyInput } from "./companies.validator.js";

export const companyService = {
  /**
   * Fetches the company profile belonging to the authenticated user.
   * Enforces that the record exists and has not been marked as removed.
   */
  async getMine(userId: number) {
    const company = await companyRepository.findByUserId(userId);

    if (!company) {
      throw new AppError("Company profile not found", 404);
    }

    if (company.is_removed) {
      throw new AppError("Company account has been removed", 403);
    }

    return company;
  },

  /**
   * Updates the company profile name for the authenticated user.
   * Enforces existence, active status (not removed), and only mutates `name`.
   */
  async updateMine(userId: number, data: UpdateCompanyInput) {
    const existing = await companyRepository.findByUserId(userId);

    if (!existing) {
      throw new AppError("Company profile not found", 404);
    }

    if (existing.is_removed) {
      throw new AppError("Company account has been removed", 403);
    }

    // Only allow updating `name`; ignore/strip any other properties
    const updated = await companyRepository.updateByUserId(userId, {
      name: data.name,
    });

    return updated;
  },
};
