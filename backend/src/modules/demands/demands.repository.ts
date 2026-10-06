import prisma from "../../../framework/config/prisma.js";
import type { DemandStatus, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

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
  async findAll(page: number, limit: number, status?: DemandStatus, roleId?: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.demandsWhereInput = {
      ...(status ? { status } : {}),
      ...(roleId ? { role_id: roleId } : {}),
    };

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

  async findPendingByUserAndRole(userId: number, roleId: number) {
    return prisma.demands.findFirst({
      where: { user_id: userId, role_id: roleId, status: "pending" },
      select: { id: true },
    });
  },

  async emailExists(email: string) {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    return user !== null;
  },

  async findRoleByName(name: string) {
    return prisma.roles.findUnique({
      where: { name },
      select: { id: true, name: true },
    });
  },

  async findDomainIds(ids: number[]) {
    const domains = await prisma.domains.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return domains.map((d) => d.id);
  },

  /**
   * Creates the temporary account and its demand atomically: either both exist
   * or neither does.
   */
  async createDemandWithUser(
    tx: Prisma.TransactionClient,
    data: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phone?: string;
      gender?: string;
      roleId: number;
      applicantEmail: string;
      applicantFirstName: string;
      applicantLastName: string;
      details?: Prisma.InputJsonValue;
      domainIds?: number[];
    },
  ) {
    const user = await tx.users.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        // Cannot sign in or reach any role-specific endpoint until approved.
        status: "pending",
        role_id: data.roleId,
        profiles: {
          create: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone ?? null,
            gender: data.gender ?? null,
          },
        },
      },
      select: { id: true, email: true, status: true },
    });

    const demand = await tx.demands.create({
      data: {
        user_id: user.id,
        role_id: data.roleId,
        status: "pending",
        applicant_email: data.applicantEmail,
        applicant_first_name: data.applicantFirstName,
        applicant_last_name: data.applicantLastName,
        ...(data.details ? { details: data.details } : {}),
      },
      select: { id: true },
    });

    if (data.domainIds && data.domainIds.length > 0) {
      await tx.demand_domains.createMany({
        data: data.domainIds.map((domain_id) => ({
          demand_id: demand.id,
          domain_id,
        })),
      });
    }

    return { user, demand };
  },

  async createDocument(
    data: {
      userId: number;
      demandId: number;
      name: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    },
    client: PrismaClient | Prisma.TransactionClient = prisma,
  ) {
    return client.documents.create({
      data: {
        user_id: data.userId,
        demand_id: data.demandId,
        name: data.name,
        type: "demand",
        file_url: data.fileUrl,
        file_size: data.fileSize,
        mime_type: data.mimeType,
      },
    });
  },

  /**
   * Marks the decision and stamps the audit snapshot. Runs inside the caller's
   * transaction so the decision and its side effects commit together.
   */
  async recordDecision(
    tx: Prisma.TransactionClient,
    data: {
      demandId: number;
      status: Extract<DemandStatus, "approved" | "rejected">;
      reviewedBy: number;
      note?: string;
      accountDeletedAt?: Date;
      notificationSentAt?: Date;
    },
  ) {
    return tx.demands.update({
      where: { id: data.demandId },
      data: {
        status: data.status,
        reviewed_by: data.reviewedBy,
        review_note: data.note ?? null,
        reviewed_at: new Date(),
        ...(data.notificationSentAt ? { decision_notification_sent_at: data.notificationSentAt } : {}),
        ...(data.accountDeletedAt ? { account_deleted_at: data.accountDeletedAt } : {}),
      },
    });
  },

  async markNotificationSent(demandId: number, sentAt = new Date()) {
    return prisma.demands.update({
      where: { id: demandId },
      data: { decision_notification_sent_at: sentAt },
    });
  },

  async markAccountDeleted(demandId: number, deletedAt = new Date()) {
    return prisma.demands.update({
      where: { id: demandId },
      data: { account_deleted_at: deletedAt },
    });
  },

  async activateUser(tx: Prisma.TransactionClient, userId: number, roleId: number) {
    return tx.users.update({
      where: { id: userId },
      data: { status: "active", role_id: roleId },
      select: { id: true, email: true, status: true },
    });
  },

  async deactivateUser(tx: Prisma.TransactionClient, userId: number) {
    return tx.users.update({
      where: { id: userId },
      data: { status: "inactive" },
    });
  },

  async assignReviewerDomain(tx: Prisma.TransactionClient, userId: number, domainId: number) {
    return tx.reviewer_domains.upsert({
      where: { user_id: userId },
      update: { domain_id: domainId },
      create: { user_id: userId, domain_id: domainId },
    });
  },

  async findOrganizationByUserId(userId: number) {
    return prisma.organizations.findFirst({
      where: { user_id: userId },
      select: { id: true, name: true },
    });
  },

  /**
   * An organization belongs to exactly one user, and only that user may own it.
   */
  async createOrganization(
    tx: Prisma.TransactionClient,
    data: {
      userId: number;
      name: string;
      email: string;
      description?: string;
      website?: string;
      phone?: string;
      location?: string;
    },
  ) {
    return tx.organizations.create({
      data: {
        user_id: data.userId,
        name: data.name,
        email: data.email,
        description: data.description ?? null,
        website: data.website ?? null,
        phone: data.phone ?? null,
        location: data.location ?? null,
      },
      select: { id: true, name: true },
    });
  },

  async findDocumentObjectsByDemand(demandId: number) {
    return prisma.documents.findMany({
      where: { demand_id: demandId },
      select: { id: true, file_url: true },
    });
  },

  /**
   * Deletes the temporary account. `demands.user_id` is ON DELETE SET NULL so the
   * demand row is preserved for audit.
   */
  async deleteUser(userId: number) {
    return prisma.users.delete({ where: { id: userId } });
  },

  async deleteUserInTx(tx: Prisma.TransactionClient, userId: number) {
    return tx.users.delete({ where: { id: userId } });
  },
};