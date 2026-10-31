import { AppError } from "../../../framework/utils/AppError.js";
import { organizationRepository } from "./organizations.repository.js";
import type { UpdateOrganizationInput } from "./organizations.validation.js";

export const organizationService = {
  /**
   * The organization is created when the Admin approves the Organization
   * registration demand, so an approved owner always has one. There is no
   * public create endpoint.
   */
  async getMine(userId: number) {
    const organization = await organizationRepository.findByOwner(userId);
    if (!organization) {
      throw new AppError("No organization found for this account", 404);
    }
    return organization;
  },

  async updateMine(userId: number, data: UpdateOrganizationInput) {
    const updated = await organizationRepository.updateOwned(userId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
    });

    if (!updated) {
      throw new AppError("No organization found for this account", 404);
    }
    return updated;
  },

  async removeMine(userId: number) {
    const deleted = await organizationRepository.deleteOwned(userId);
    if (!deleted) {
      throw new AppError("No organization found for this account", 404);
    }
    return { deleted: true };
  },
};