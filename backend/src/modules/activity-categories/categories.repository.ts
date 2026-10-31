import prisma from "../../../framework/config/prisma.js";

const categorySelect = {
  id: true,
  name: true,
  description: true,
  created_at: true,
  updated_at: true,
};

export type CategoryView = {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

export type CategoryListParams = {
  page: number;
  limit: number;
  q?: string;
};

export const activityCategoryRepository = {
  async findAll(params: CategoryListParams) {
    const where = params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {};

    const [categories, total] = await Promise.all([
      prisma.activity_categories.findMany({
        where,
        select: categorySelect,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { id: "asc" },
      }),
      prisma.activity_categories.count({ where }),
    ]);

    return { categories, total };
  },

  async findById(id: number) {
    return prisma.activity_categories.findUnique({
      where: { id },
      select: categorySelect,
    });
  },

  async findByName(name: string) {
    return prisma.activity_categories.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(name: string, description?: string) {
    return prisma.activity_categories.create({
      data: { name, description },
      select: categorySelect,
    });
  },

  async update(id: number, data: { name?: string; description?: string | null }) {
    return prisma.activity_categories.update({
      where: { id },
      data,
      select: categorySelect,
    });
  },

  async countActivitiesByCategoryId(id: number) {
    return prisma.volunteering_activities.count({
      where: { category_id: id },
    });
  },

  async remove(id: number) {
    await prisma.activity_categories.delete({ where: { id } });
  },
};
