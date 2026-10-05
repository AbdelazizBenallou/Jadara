import prisma from "../../../framework/config/prisma.js";

const subDomainSelect = {
  id: true,
  name: true,
  description: true,
  domain_id: true,
  created_at: true,
  updated_at: true,
  domain: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const subDomainRepository = {
  async findAll(page: number, limit: number, domainId?: number) {
    const skip = (page - 1) * limit;
    const where = domainId !== undefined ? { domain_id: domainId } : {};

    const [subDomains, total] = await Promise.all([
      prisma.sub_domains.findMany({
        where,
        select: subDomainSelect,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.sub_domains.count({ where }),
    ]);

    return { subDomains, total };
  },

  async findById(id: number) {
    return prisma.sub_domains.findUnique({
      where: { id },
      select: subDomainSelect,
    });
  },

  async findByDomainAndName(domainId: number, name: string) {
    return prisma.sub_domains.findUnique({
      where: {
        domain_id_name: {
          domain_id: domainId,
          name,
        },
      },
      select: { id: true, name: true, domain_id: true },
    });
  },

  async create(domainId: number, name: string, description?: string) {
    return prisma.sub_domains.create({
      data: {
        domain_id: domainId,
        name,
        description,
      },
      select: subDomainSelect,
    });
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      domain_id?: number;
    },
  ) {
    return prisma.sub_domains.update({
      where: { id },
      data,
      select: subDomainSelect,
    });
  },

  async countProjectsBySubDomainId(id: number) {
    return prisma.projects.count({
      where: { sub_domain_id: id },
    });
  },

  async remove(id: number) {
    await prisma.sub_domains.delete({
      where: { id },
    });
  },
};
