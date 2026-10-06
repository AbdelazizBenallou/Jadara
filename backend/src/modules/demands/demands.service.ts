import prisma from "../../../framework/config/prisma.js";
import { AppError } from "../../../framework/utils/AppError.js";
import { hash } from "../../../framework/utils/hash.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { cache } from "../../../framework/utils/cache.js";
import logger from "../../../framework/config/logger.js";
import { demandRepository } from "./demands.repository.js";
import { demandNotification } from "./demands.notification.js";
import { isDemandRole, type DemandRole } from "./demands.constants.js";
import type {
  ListDemandsInput,
  ReviewDemandInput,
  SubmitDemandInput,
} from "./demands.validator.js";

type DemandRow = NonNullable<Awaited<ReturnType<typeof demandRepository.findById>>>;

type OrganizationDetails = {
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
};

function parseOrganizationDetails(details: unknown): OrganizationDetails | null {
  if (details === null || typeof details !== "object") return null;
  const value = details as Record<string, unknown>;
  return typeof value.name === "string" && value.name.trim() !== ""
    ? (value as unknown as OrganizationDetails)
    : null;
}

export const demandService = {
  /**
   * Public submission for Reviewer, Company and Organization.
   *
   * Creates the temporary account plus its PENDING demand in one transaction,
   * then uploads the supporting documents outside of it. No tokens are issued:
   * the account cannot be used until an Admin approves the demand.
   */
  async submit(data: SubmitDemandInput, files: Express.Multer.File[] = []) {
    if (!isDemandRole(data.role)) {
      throw new AppError("Invalid demand role", 400);
    }
    const role = data.role as DemandRole;

    if (await demandRepository.emailExists(data.email)) {
      throw new AppError("Email already registered", 409);
    }

    const roleRow = await demandRepository.findRoleByName(role);
    if (!roleRow) {
      throw new AppError(`Role ${role} is not configured`, 400);
    }

    // Reviewer must state the domain they will review.
    if (role === "Reviewer" && (!data.domain_ids || data.domain_ids.length === 0)) {
      throw new AppError("Reviewer must select at least one domain", 400);
    }

    // An Organization demand must describe the organization being claimed.
    let organization: OrganizationDetails | null = null;
    if (role === "Organization") {
      organization = data.organization ?? null;
      if (!organization) {
        throw new AppError("Organization details are required", 400);
      }
    }

    if (files.length === 0) {
      throw new AppError("At least one supporting document is required", 400);
    }

    if (data.domain_ids && data.domain_ids.length > 0) {
      const existing = await demandRepository.findDomainIds(data.domain_ids);
      if (existing.length !== data.domain_ids.length) {
        throw new AppError("Some domains do not exist", 400);
      }
    }

    const passwordHash = await hash.password(data.password);

    const created = await prisma.$transaction(async (tx) => {
      const result = await demandRepository.createDemandWithUser(tx, {
        email: data.email,
        passwordHash,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        gender: data.gender,
        roleId: roleRow.id,
        applicantEmail: data.email,
        applicantFirstName: data.first_name,
        applicantLastName: data.last_name,
        ...(organization ? { details: organization as object } : {}),
        domainIds: data.domain_ids,
      });

      return result;
    });

    const documents = [];
    for (const file of files) {
      const uploaded = await storage.upload(
        BUCKETS.documents,
        "demands",
        file,
        created.user.id,
      );
      const doc = await demandRepository.createDocument({
        userId: created.user.id,
        demandId: created.demand.id,
        name: file.originalname,
        fileUrl: uploaded.objectName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
      });
      documents.push({
        id: doc.id,
        name: doc.name,
        mime_type: doc.mime_type,
        file_size: doc.file_size,
      });
    }

    logger.info(
      { demandId: created.demand.id, userId: created.user.id, role },
      "Registration demand submitted",
    );

    return {
      user: {
        id: created.user.id,
        email: created.user.email,
        status: created.user.status,
      },
      demand: {
        id: created.demand.id,
        role,
        status: "pending" as const,
      },
      documents,
    };
  },

  async getAll(query: ListDemandsInput & Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const status = query.status;

    let roleId: number | undefined;
    if (query.role) {
      const role = await demandRepository.findRoleByName(query.role);
      if (!role) {
        throw new AppError("Invalid role", 400);
      }
      roleId = role.id;
    }

    const { demands, total } = await demandRepository.findAll(page, limit, status, roleId);
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

  async getMine(userId: number) {
    const demand = await demandRepository.findByUserId(userId);
    if (!demand) {
      throw new AppError("No registration demand found", 404);
    }
    return this.mapDemand(demand);
  },

  /**
   * Grants the requested role and activates the account.
   */
  async approve(id: number, adminId: number, note?: ReviewDemandInput["note"]) {
    const demand = await this.loadReviewable(id, adminId);

    await prisma.$transaction(async (tx) => {
      await demandRepository.activateUser(tx, demand.user_id!, demand.role_id);

      // Reviewer is bound to a single review domain.
      if (demand.roles.name === "Reviewer" && demand.demand_domains.length > 0) {
        await demandRepository.assignReviewerDomain(
          tx,
          demand.user_id!,
          demand.demand_domains[0].domain_id,
        );
      }

      // Approved Organization demand becomes the user's owned organization.
      if (demand.roles.name === "Organization") {
        const details = parseOrganizationDetails(demand.details);
        if (details) {
          const existing = await demandRepository.findOrganizationByUserId(demand.user_id!);
          if (!existing) {
            await demandRepository.createOrganization(tx, {
              userId: demand.user_id!,
              name: details.name,
              email: details.email ?? demand.applicant_email ?? "",
              description: details.description,
              website: details.website,
              phone: details.phone,
              location: details.location,
            });
          }
        }
      }

      await demandRepository.recordDecision(tx, {
        demandId: demand.id,
        status: "approved",
        reviewedBy: adminId,
        note,
      });
    });

    // The account can now reach role-specific endpoints, so its cached
    // permissions must be recomputed.
    await cache.del(`permissions:user:${demand.user_id}`);

    const notified = await demandNotification.sendApproved(demand, note);
    if (notified) {
      await demandRepository.markNotificationSent(demand.id);
    } else {
      logger.error(
        { demandId: demand.id, userId: demand.user_id },
        "Approval email failed to send, demand_notification_sent_at not set",
      );
    }

    return this.getById(id);
  },

  /**
   * Rejects the demand. The account is only deleted once the rejection email has
   * been accepted by the mail provider; the demand row itself is always kept.
   */
  async reject(id: number, adminId: number, note?: ReviewDemandInput["note"]) {
    const demand = await this.loadReviewable(id, adminId);

    await prisma.$transaction(async (tx) => {
      // Keep the account disabled until the rejection email is confirmed sent.
      if (demand.user_id !== null) {
        await demandRepository.deactivateUser(tx, demand.user_id);
      }

      await demandRepository.recordDecision(tx, {
        demandId: demand.id,
        status: "rejected",
        reviewedBy: adminId,
        note,
      });
    });

    const notified = await demandNotification.sendRejected(demand, note);

    if (!notified) {
      logger.error(
        { demandId: demand.id, userId: demand.user_id },
        "Rejection email failed to send; temporary account kept for retry",
      );
      return this.getById(id);
    }

    await demandRepository.markNotificationSent(demand.id);

    if (demand.user_id !== null) {
      await this.deleteTemporaryAccount(demand);
    }

    return this.getById(id);
  },

  /**
   * Re-sends the decision email and, for a rejection, completes the account
   * cleanup that was skipped because the first send failed.
   */
  async resendNotification(id: number, adminId: number) {
    const demand = await demandRepository.findById(id);
    if (!demand) {
      throw new AppError("Demand not found", 404);
    }
    if (demand.status === "pending") {
      throw new AppError("Demand has not been reviewed yet", 409);
    }
    if (demand.user_id !== null && demand.user_id === adminId) {
      throw new AppError("You cannot review your own demand", 403);
    }

    const notified =
      demand.status === "approved"
        ? await demandNotification.sendApproved(demand, demand.review_note ?? undefined)
        : await demandNotification.sendRejected(demand, demand.review_note ?? undefined);

    if (!notified) {
      logger.error({ demandId: demand.id }, "Decision notification retry failed");
      throw new AppError("Failed to send notification email", 502);
    }

    await demandRepository.markNotificationSent(demand.id);

    if (demand.status === "rejected" && demand.user_id !== null) {
      await this.deleteTemporaryAccount(demand);
    }

    return this.getById(id);
  },

  /**
   * Loads a demand that is ready to be reviewed, rejecting anything an Admin
   * must not decide (missing, already decided, or their own demand).
   */
  async loadReviewable(id: number, adminId: number): Promise<DemandRow> {
    const demand = await demandRepository.findById(id);
    if (!demand) {
      throw new AppError("Demand not found", 404);
    }
    if (demand.status !== "pending") {
      throw new AppError("Demand is already reviewed", 409);
    }
    if (demand.user_id !== null && demand.user_id === adminId) {
      throw new AppError("You cannot review your own demand", 403);
    }
    return demand;
  },

  /**
   * Removes the temporary account and its stored documents. The demand survives
   * because `demands.user_id` is ON DELETE SET NULL.
   */
  async deleteTemporaryAccount(demand: DemandRow): Promise<void> {
    const userId = demand.user_id;
    if (userId === null) return;

    const stored = await demandRepository.findDocumentObjectsByDemand(demand.id);
    for (const doc of stored) {
      try {
        await storage.delete(BUCKETS.documents, doc.file_url);
      } catch (err) {
        logger.error(
          { err, demandId: demand.id, objectName: doc.file_url },
          "Failed to delete stored demand document",
        );
      }
    }

    try {
      await demandRepository.deleteUser(userId);
    } catch (err) {
      logger.error(
        { err, demandId: demand.id, userId },
        "Failed to delete temporary account after rejection",
      );
      throw new AppError("Failed to delete temporary account", 500);
    }

    await demandRepository.markAccountDeleted(demand.id);
    logger.info({ demandId: demand.id, userId }, "Temporary account deleted after rejection");
  },

  async mapDemand(d: DemandRow) {
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
      // Falls back to the snapshot once the applicant account is deleted.
      applicant: d.applicant ?? {
        id: null,
        email: d.applicant_email,
        status: "deleted",
        profiles: {
          first_name: d.applicant_first_name,
          last_name: d.applicant_last_name,
          phone: null,
          avatar: null,
        },
      },
      domains: d.demand_domains.map((dd) => dd.domains),
      documents,
      details: d.details,
      review_note: d.review_note,
      reviewed_at: d.reviewed_at,
      reviewed_by: d.reviewed_by,
      notification_sent_at: d.decision_notification_sent_at,
      account_deleted_at: d.account_deleted_at,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  },
};