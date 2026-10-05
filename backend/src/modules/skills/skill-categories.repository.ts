import prisma from "../../../framework/config/prisma.js";

const categorySelect = {
  id: true,
  name: true,
  description: true,
  created_at: true,
  updated_at: true,
};

export const skillCategoryRepository = {
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.skill_categories.findMany({
        select: categorySelect,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.skill_categories.count(),
    ]);

    return { categories, total };
  },

  async findById(id: number) {
    return prisma.skill_categories.findUnique({
      where: { id },
      select: categorySelect,
    });
  },

  async findByName(name: string) {
    return prisma.skill_categories.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(name: string, description?: string) {
    return prisma.skill_categories.create({
      data: { name, description },
      select: categorySelect,
    });
  },

  async countSkillsByCategoryId(id: number) {
    return prisma.skills.count({
      where: { category_id: id },
    });
  },

  async remove(id: number) {
    await prisma.skill_categories.delete({
      where: { id },
    });
  },
};
