import prisma from "../../../framework/config/prisma.js";

const domainSelect = {
  id: true,
  name: true,
  description: true,
  created_at: true,
  updated_at: true,
};

export const domainRepository = {
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [domains, total] = await Promise.all([
      prisma.domains.findMany({
        select: domainSelect,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.domains.count(),
    ]);

    return { domains, total };
  },

  async findById(id: number) {
    return prisma.domains.findUnique({
      where: { id },
      select: domainSelect,
    });
  },

  async findByName(name: string) {
    return prisma.domains.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(name: string, description?: string) {
    return prisma.domains.create({
      data: { name, description },
      select: domainSelect,
    });
  },

  async update(id: number, data: { name?: string; description?: string | null }) {
    return prisma.domains.update({
      where: { id },
      data,
      select: domainSelect,
    });
  },

  async countSkillsByDomainId(id: number) {
    return prisma.skill_domains.count({ where: { domain_id: id } });
  },

  async countProjectsByDomainId(id: number) {
    return prisma.projects.count({ where: { domain_id: id } });
  },

  async getSkillsByDomainId(id: number) {
    const rows = await prisma.skill_domains.findMany({
      where: { domain_id: id },
      select: {
        skills: {
          select: { id: true, name: true, description: true, status: true },
        },
      },
      orderBy: { id: "asc" },
    });
    return rows.map((row) => row.skills);
  },

  async findReviewersByDomainId(id: number) {
    const rows = await prisma.reviewer_domains.findMany({
      where: { domain_id: id },
      select: {
        created_at: true,
        users: {
          select: {
            id: true,
            email: true,
            status: true,
            profiles: { select: { first_name: true, last_name: true, avatar: true } },
          },
        },
      },
      orderBy: { created_at: "asc" },
    });
    return rows.map((row) => ({
      id: row.users.id,
      email: row.users.email,
      status: row.users.status,
      profile: row.users.profiles,
      assigned_at: row.created_at,
    }));
  },

  async findAllReviewers() {
    const domains = await prisma.domains.findMany({
      select: {
        id: true,
        name: true,
        reviewer_domains: {
          select: {
            created_at: true,
            users: {
              select: {
                id: true,
                email: true,
                status: true,
                profiles: { select: { first_name: true, last_name: true, avatar: true } },
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });
    return domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      reviewers: domain.reviewer_domains.map((row) => ({
        id: row.users.id,
        email: row.users.email,
        status: row.users.status,
        profile: row.users.profiles,
        assigned_at: row.created_at,
      })),
    }));
  },

  async findExistingSkillIds(ids: number[]) {
    const rows = await prisma.skills.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  },

  async findLinkedSkillIds(skillIds: number[], domainId: number) {
    const rows = await prisma.skill_domains.findMany({
      where: { domain_id: domainId, skill_id: { in: skillIds } },
      select: { skill_id: true },
    });
    return rows.map((row) => row.skill_id);
  },

  async addSkillsToDomain(skillIds: number[], domainId: number) {
    await prisma.skill_domains.createMany({
      data: skillIds.map((skill_id) => ({ skill_id, domain_id: domainId })),
      skipDuplicates: true,
    });
  },

  async remove(id: number) {
    await prisma.domains.delete({ where: { id } });
  },
};
