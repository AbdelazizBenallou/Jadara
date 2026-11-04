import prisma from "../../../framework/config/prisma.js";
import type { Prisma } from "@prisma/client";

export const organizationRepository = {
  async findByOwner(userId: number) {
    return prisma.organizations.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
      include: {
        user: {
          include: {
            profiles: true,
          },
        },
      },
    });
  },

  async findById(id: number) {
    return prisma.organizations.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profiles: true,
            user_socials: true,
          },
        },
        activities: {
          where: { is_active: true, status: "published" },
          orderBy: { created_at: "desc" },
          include: {
            category: true,
            required_skills: {
              include: {
                skill: true,
              },
            },
            _count: {
              select: {
                applications: { where: { status: "accepted" } },
              },
            },
          },
        },
        _count: {
          select: {
            activities: true,
            user_completed_volunteering: true,
          },
        },
      },
    });
  },

  async list(params: { page: number; limit: number; q?: string }) {
    const where: Prisma.organizationsWhereInput = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: "insensitive" } },
        { location: { contains: params.q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        include: {
          user: {
            include: {
              profiles: true,
            },
          },
          _count: {
            select: {
              activities: { where: { is_active: true, status: "published" } },
              user_completed_volunteering: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.organizations.count({ where }),
    ]);

    return { items, total };
  },

  async updateOwned(userId: number, data: Prisma.organizationsUpdateInput) {
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
