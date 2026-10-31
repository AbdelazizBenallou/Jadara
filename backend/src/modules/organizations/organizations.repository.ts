import prisma from "../../../framework/config/prisma.js";
import type { Prisma } from "@prisma/client";

// Self-service routes only ever address the caller's own organization, so every
// method here is scoped by owner. There is no way to reach another account's
// organization because no organization ID is accepted from the caller.
export const organizationRepository = {
  async findByOwner(userId: number) {
    return prisma.organizations.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });
  },

  async updateOwned(userId: number, data: Prisma.organizationsUpdateInput) {
    // The ownership filter is part of the UPDATE, so a foreign user simply
    // matches no rows instead of updating someone else's organization.
    const result = await prisma.organizations.updateMany({
      where: { user_id: userId },
      data,
    });

    if (result.count === 0) return null;

    return prisma.organizations.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });
  },

  async deleteOwned(userId: number) {
    const result = await prisma.organizations.deleteMany({
      where: { user_id: userId },
    });

    return result.count > 0;
  },
};