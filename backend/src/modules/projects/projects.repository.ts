import prisma from "../../../framework/config/prisma.js";

const projectSelect = {
  id: true,
  user_id: true,
  domain_id: true,
  title: true,
  description: true,
  github_url: true,
  live_url: true,
  figma_url: true,
  status: true,
  created_at: true,
  updated_at: true,
  domains: {
    select: { id: true, name: true },
  },
  evidence: {
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      file_url: true,
      external_url: true,
      created_at: true,
    },
  },
};

const projectReviewsSelect = {
  project_reviews: {
    select: {
      id: true,
      rating: true,
      feedback: true,
      created_at: true,
      updated_at: true,
      reviewer: {
        select: {
          id: true,
          email: true,
          profiles: { select: { first_name: true, last_name: true, avatar: true } },
        },
      },
    },
  },
};

export const projectRepository = {
  async findAllByUserId(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { user_id: userId };

    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        select: projectSelect,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.projects.count({ where }),
    ]);

    return { projects, total };
  },

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        select: {
          ...projectSelect,
          users: {
            select: {
              id: true,
              email: true,
              profiles: { select: { first_name: true, last_name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.projects.count(),
    ]);

    return { projects, total };
  },

  async findById(id: number) {
    return prisma.projects.findUnique({
      where: { id },
      select: {
        ...projectSelect,
        ...projectReviewsSelect,
      },
    });
  },

  async findByIdWithUser(id: number) {
    return prisma.projects.findUnique({
      where: { id },
      select: {
        ...projectSelect,
        ...projectReviewsSelect,
        users: {
          select: {
            id: true,
            email: true,
            profiles: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
  },

  async create(
    userId: number,
    data: {
      title: string;
      description?: string;
      github_url?: string;
      live_url?: string;
      figma_url?: string;
      domain_id?: number | null;
    },
  ) {
    return prisma.projects.create({
      data: {
        user_id: userId,
        title: data.title,
        description: data.description,
        github_url: data.github_url,
        live_url: data.live_url,
        figma_url: data.figma_url,
        domain_id: data.domain_id,
        status: "draft",
      },
      select: projectSelect,
    });
  },

  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      github_url?: string | null;
      live_url?: string | null;
      figma_url?: string | null;
      domain_id?: number | null;
    },
  ) {
    return prisma.projects.update({
      where: { id },
      data,
      select: projectSelect,
    });
  },

  async updateStatus(id: number, status: "draft" | "submitted" | "under_review" | "verified") {
    return prisma.projects.update({
      where: { id },
      data: { status, updated_at: new Date() },
      select: { id: true, status: true },
    });
  },

  async delete(id: number) {
    await prisma.projects.delete({ where: { id } });
  },

  async findExistingDomain(id: number) {
    return prisma.domains.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async addEvidence(
    projectId: number,
    data: {
      type: string;
      title: string;
      description?: string;
      file_url?: string;
      external_url?: string;
    },
  ) {
    return prisma.evidence.create({
      data: {
        project_id: projectId,
        type: data.type,
        title: data.title,
        description: data.description,
        file_url: data.file_url,
        external_url: data.external_url,
      },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        file_url: true,
        external_url: true,
        created_at: true,
      },
    });
  },

  async removeEvidence(evidenceId: number, projectId: number) {
    const result = await prisma.evidence.deleteMany({
      where: { id: evidenceId, project_id: projectId },
    });
    return result.count;
  },

  async findEvidenceById(evidenceId: number) {
    return prisma.evidence.findUnique({
      where: { id: evidenceId },
      select: { id: true, project_id: true, file_url: true },
    });
  },

  async ratingsSummary(projectIds: number[]) {
    const grouped = await prisma.project_reviews.groupBy({
      by: ["project_id"],
      where: { project_id: { in: projectIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return new Map(
      grouped.map((g) => [g.project_id, { average: g._avg.rating, count: g._count.rating }]),
    );
  },
};
