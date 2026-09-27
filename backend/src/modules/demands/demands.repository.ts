import prisma from "../../../framework/config/prisma.js";
import type { DemandStatus, Prisma } from "@prisma/client";

const demandInclude = {
  roles: { select: { id: true, name: true } },
  applicant: {
    select: {
      id: true,
      email: true,
      status: true,
      profiles: { select: { first_name: true, last_name: true, phone: true, avatar: true } },
    },
  },
  demand_domains: {
    select: {
      domain_id: true,
      domains: { select: { id: true, name: true } },
    },
  },
  documents: {
    select: {
      id: true,
      name: true,
      type: true,
      file_url: true,
      file_size: true,
      mime_type: true,
      created_at: true,
    },
  },
} as const;

export const demandRepository = {
  async findAll(page: number, limit: number, status?: DemandStatus) {
    const skip = (page - 1) * limit;
    const where: Prisma.demandsWhereInput = status ? { status } : {};

    const [demands, total] = await Promise.all([
      prisma.demands.findMany({
        where,
        include: demandInclude,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.demands.count({ where }),
    ]);

    return { demands, total };
  },

  async findById(id: number) {
    return prisma.demands.findUnique({
      where: { id },
      include: demandInclude,
    });
  },

  async findByUserId(userId: number) {
    return prisma.demands.findFirst({
      where: { user_id: userId },
      include: demandInclude,
      orderBy: { created_at: "desc" },
    });
  },
};
