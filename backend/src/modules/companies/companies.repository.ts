import prisma from "../../../framework/config/prisma.js";

export const companyRepository = {
  /**
   * Finds the company record owned by the specified user ID.
   * Scoped strictly by user_id to enforce ownership.
   */
  async findByUserId(userId: number) {
    return prisma.companies.findUnique({
      where: { user_id: userId },
    });
  },

  /**
   * Updates the company name for the company owned by the specified user ID.
   * Scoped strictly by user_id to prevent modifying another account's record.
   */
  async updateByUserId(userId: number, data: { name: string }) {
    return prisma.companies.update({
      where: { user_id: userId },
      data: {
        name: data.name,
      },
    });
  },
};
