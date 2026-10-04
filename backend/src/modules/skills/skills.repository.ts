import prisma from "../../../framework/config/prisma.js";

const skillSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  category_id: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const skillRepository = {
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [skills, total] = await Promise.all([
      prisma.skills.findMany({
        select: skillSelect,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.skills.count(),
    ]);

    return { skills, total };
  },

  async findById(id: number) {
    return prisma.skills.findUnique({
      where: { id },
      select: skillSelect,
    });
  },

  async findByName(name: string) {
    return prisma.skills.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(
    name: string,
    category_id: number,
    description?: string,
    status?: "active" | "inactive",
  ) {
    return prisma.skills.create({
      data: { name, category_id, description, status },
      select: skillSelect,
    });
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      status?: "active" | "inactive";
      category_id?: number;
    },
  ) {
    return prisma.skills.update({
      where: { id },
      data,
      select: skillSelect,
    });
  },

  async countUserSkills(id: number) {
    return prisma.user_skills.count({ where: { skill_id: id } });
  },

  async countDomainLinks(id: number) {
    return prisma.skill_domains.count({ where: { skill_id: id } });
  },

  async remove(id: number) {
    await prisma.skills.delete({ where: { id } });
  },
};
