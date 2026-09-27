import prisma from "../../../framework/config/prisma.js";

const languageSelect = {
  id: true,
  name: true,
  code: true,
  status: true,
  created_at: true,
  updated_at: true,
};

export const languageRepository = {
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [languages, total] = await Promise.all([
      prisma.languages.findMany({
        select: languageSelect,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.languages.count(),
    ]);

    return { languages, total };
  },

  async findById(id: number) {
    return prisma.languages.findUnique({
      where: { id },
      select: languageSelect,
    });
  },

  async findByName(name: string) {
    return prisma.languages.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(name: string, code?: string, status?: "active" | "inactive") {
    return prisma.languages.create({
      data: { name, code, status },
      select: languageSelect,
    });
  },

  async update(
    id: number,
    data: { name?: string; code?: string | null; status?: "active" | "inactive" },
  ) {
    return prisma.languages.update({
      where: { id },
      data,
      select: languageSelect,
    });
  },

  async countUserLanguages(id: number) {
    return prisma.user_languages.count({ where: { language_id: id } });
  },

  async remove(id: number) {
    await prisma.languages.delete({ where: { id } });
  },
};
