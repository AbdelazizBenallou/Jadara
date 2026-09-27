import prisma from "../../../framework/config/prisma.js";
import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { demandRepository } from "./demands.repository.js";
import { demandNotification } from "./demands.notification.js";
import type { ListDemandsInput, ReviewDemandInput } from "./demands.validator.js";

export const demandService = {
  async getAll(query: ListDemandsInput & Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const status = query.status;

    const { demands, total } = await demandRepository.findAll(page, limit, status);
    const totalPages = Math.ceil(total / limit);

    return {
      demands: await Promise.all(demands.map((d) => this.mapDemand(d))),
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  async getById(id: number) {
    const demand = await demandRepository.findById(id);
    if (!demand) {
      throw new AppError("Demand not found", 404);
    }
    return this.mapDemand(demand);
  },

  async approve(id: number, adminId: number, note?: string) {
    const demand = await demandRepository.findById(id);
    if (!demand) {
      throw new AppError("Demand not found", 404);
    }
    if (demand.status !== "pending") {
      throw new AppError("Demand is already reviewed", 409);
    }

    const isReviewer = demand.roles.name === "Reviewer";

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: demand.user_id },
        data: { status: "active" },
      });

      if (isReviewer && demand.demand_domains.length > 0) {
        await tx.reviewer_domains.createMany({
          data: demand.demand_domains.map((dd) => ({
            user_id: demand.user_id,
            domain_id: dd.domain_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.demands.update({
        where: { id: demand.id },
        data: {
          status: "approved",
          reviewed_by: adminId,
          review_note: note ?? null,
          reviewed_at: new Date(),
        },
      });
    });

    await demandNotification.sendApproved(demand, note);

    return this.getById(id);
  },

  async reject(id: number, adminId: number, note?: string) {
    const demand = await demandRepository.findById(id);
    if (!demand) {
      throw new AppError("Demand not found", 404);
    }
    if (demand.status !== "pending") {
      throw new AppError("Demand is already reviewed", 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: demand.user_id },
        data: { status: "inactive" },
      });

      await tx.demands.update({
        where: { id: demand.id },
        data: {
          status: "rejected",
          reviewed_by: adminId,
          review_note: note ?? null,
          reviewed_at: new Date(),
        },
      });
    });

    await demandNotification.sendRejected(demand, note);

    return this.getById(id);
  },

  async mapDemand(d: NonNullable<Awaited<ReturnType<typeof demandRepository.findById>>>) {
    const documents = await Promise.all(
      d.documents.map(async (doc) => ({
        ...doc,
        download_url: await storage.getPresignedUrl(BUCKETS.documents, doc.file_url),
      })),
    );
    return {
      id: d.id,
      status: d.status,
      role: d.roles,
      applicant: d.applicant,
      domains: d.demand_domains.map((dd) => dd.domains),
      documents,
      review_note: d.review_note,
      reviewed_at: d.reviewed_at,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  },
};
