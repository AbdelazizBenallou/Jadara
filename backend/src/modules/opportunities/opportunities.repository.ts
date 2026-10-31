import prisma from "../../../framework/config/prisma.js";
import { Prisma, type OpportunityStatus } from "@prisma/client";
import { AppError } from "../../../framework/utils/AppError.js";
import type { CreateOpportunityDraftInput } from "./opportunities.validator.js";

const opportunityInclude = {
  domain: {
    select: {
      id: true,
      name: true,
    },
  },
  sub_domain: {
    select: {
      id: true,
      name: true,
      domain_id: true,
    },
  },
  required_skills: {
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          category_id: true,
        },
      },
    },
  },
  _count: {
    select: {
      registrations: true,
    },
  },
  company: {
    select: {
      id: true,
      name: true,
      is_removed: true,
    },
  },
} as const;

export type OpportunityWithRelations = Prisma.opportunitiesGetPayload<{
  include: typeof opportunityInclude;
}>;

export interface ListOpportunitiesParams {
  page: number;
  limit: number;
  status?: OpportunityStatus;
}

export interface BrowsePublishedParams {
  page: number;
  limit: number;
  domain_id?: number;
  type?: string;
  q?: string;
}

export interface ListMyRegistrationsParams {
  page: number;
  limit: number;
}

export interface ListOpportunityRegistrantsParams {
  page: number;
  limit: number;
}

export const opportunityRepository = {
  /**
   * Finds the company record associated with the user ID.
   */
  async findCompanyByUserId(userId: number) {
    return prisma.companies.findUnique({
      where: { user_id: userId },
    });
  },

  /**
   * Finds an opportunity by its ID with all associated relations and registration count.
   */
  async findById(id: number): Promise<OpportunityWithRelations | null> {
    return prisma.opportunities.findUnique({
      where: { id },
      include: opportunityInclude,
    });
  },

  /**
   * Creates a draft opportunity with optional taxonomy and required skill links.
   */
  async createDraft(
    companyId: number,
    data: CreateOpportunityDraftInput,
  ): Promise<OpportunityWithRelations> {
    const uniqueSkillIds = data.required_skill_ids
      ? [...new Set(data.required_skill_ids)]
      : [];

    return prisma.opportunities.create({
      data: {
        company_id: companyId,
        title: data.title,
        description: data.description ?? null,
        type: data.type ?? null,
        domain_id: data.domain_id ?? null,
        sub_domain_id: data.sub_domain_id ?? null,
        registration_deadline: data.registration_deadline ?? null,
        status: "draft",
        required_skills:
          uniqueSkillIds.length > 0
            ? {
                create: uniqueSkillIds.map((skill_id) => ({
                  skill_id,
                })),
              }
            : undefined,
      },
      include: opportunityInclude,
    });
  },

  /**
   * Lists opportunities owned by a company with pagination and optional status filter.
   */
  async listOwned(companyId: number, params: ListOpportunitiesParams) {
    const where: Prisma.opportunitiesWhereInput = {
      company_id: companyId,
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.opportunities.findMany({
        where,
        include: opportunityInclude,
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.opportunities.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Atomically deletes a draft opportunity strictly when:
   * 1. It belongs to the specified company.
   * 2. Its status is 'draft'.
   * 3. It has zero registrations.
   *
   * Catches foreign key constraint violation (P2003) if a concurrent
   * registration triggers ON DELETE RESTRICT, mapping it to HTTP 409.
   */
  async deleteDraft(companyId: number, id: number): Promise<number> {
    try {
      const result = await prisma.opportunities.deleteMany({
        where: {
          id,
          company_id: companyId,
          status: "draft",
          registrations: { none: {} },
        },
      });
      return result.count;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
      ) {
        throw new AppError("Cannot delete opportunity with existing registrations", 409);
      }
      throw err;
    }
  },

  /**
   * Locks the opportunity row exclusively using SELECT ... FOR UPDATE within an
   * interactive transaction, and returns the opportunity with relations and registration count.
   */
  async findForUpdate(
    id: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<OpportunityWithRelations | null> {
    await tx.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM opportunities
      WHERE id = ${id}
      FOR UPDATE
    `;
    return tx.opportunities.findUnique({
      where: { id },
      include: opportunityInclude,
    });
  },

  /**
   * Updates opportunity scalar fields and optionally synchronizes required skills within a transaction.
   */
  async updateOpportunity(
    id: number,
    data: Prisma.opportunitiesUncheckedUpdateInput,
    skillIds?: number[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<OpportunityWithRelations> {
    if (skillIds !== undefined) {
      const uniqueSkillIds = [...new Set(skillIds)];
      await tx.opportunity_required_skills.deleteMany({
        where: { opportunity_id: id },
      });
      if (uniqueSkillIds.length > 0) {
        await tx.opportunity_required_skills.createMany({
          data: uniqueSkillIds.map((skill_id) => ({
            opportunity_id: id,
            skill_id,
          })),
        });
      }
    }

    return tx.opportunities.update({
      where: { id },
      data,
      include: opportunityInclude,
    });
  },

  /**
   * Checks domain existence.
   */
  async findDomainById(id: number, client: Prisma.TransactionClient | typeof prisma = prisma) {
    return client.domains.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  /**
   * Checks sub-domain existence.
   */
  async findSubDomainById(id: number, client: Prisma.TransactionClient | typeof prisma = prisma) {
    return client.sub_domains.findUnique({
      where: { id },
      select: { id: true, name: true, domain_id: true },
    });
  },

  /**
   * Lists published opportunities visible to all authenticated users.
   * Hard-codes status = 'published'. Optionally filters by domain_id, type, and
   * a case-insensitive title keyword (q). Includes company.is_removed so the
   * service can compute the registration_open availability flag without an
   * additional round-trip.
   */
  async listPublished(params: BrowsePublishedParams) {
    const where: Prisma.opportunitiesWhereInput = {
      status: "published",
      ...(params.domain_id !== undefined ? { domain_id: params.domain_id } : {}),
      ...(params.type !== undefined ? { type: params.type as import("@prisma/client").OpportunityType } : {}),
      ...(params.q !== undefined && params.q.length > 0
        ? { title: { contains: params.q, mode: "insensitive" } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.opportunities.findMany({
        where,
        include: opportunityInclude,
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.opportunities.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Returns matching skill IDs among the provided list.
   */
  async findExistingSkillIds(
    ids: number[],
    client: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<number[]> {
    if (ids.length === 0) return [];
    const rows = await client.skills.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  },

  /**
   * Returns a paginated list of non-anonymous registrants for an opportunity,
   * ordered newest-registration-first.
   *
   * Anonymous registrations (beneficiary_id IS NULL) are excluded from the
   * individual list while their existence is preserved in the database.
   *
   * Exposes: beneficiary_id, first_name, last_name, registered_at.
   * Deliberately excludes: email, phone, date_of_birth, gender, avatar, skills,
   * education and any field belonging to Talent Discovery scope.
   *
   * No opportunity status filter is applied: registrations for closed or
   * deadline-expired opportunities are included for historical visibility.
   */
  async listOpportunityRegistrants(
    opportunityId: number,
    params: ListOpportunityRegistrantsParams,
  ): Promise<{ items: Array<{
    id: number;
    opportunity_id: number;
    beneficiary_id: number;
    registered_at: Date;
    beneficiary: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    };
  }>; total: number }> {
    const where = {
      opportunity_id: opportunityId,
      beneficiary_id: { not: null },
    };
    const skip = (params.page - 1) * params.limit;

    const [rawItems, total] = await Promise.all([
      prisma.opportunity_registrations.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: params.limit,
        select: {
          id: true,
          opportunity_id: true,
          beneficiary_id: true,
          created_at: true,
          beneficiary: {
            select: {
              id: true,
              profiles: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      }),
      prisma.opportunity_registrations.count({ where }),
    ]);

    // Flatten profile into beneficiary for cleaner service/projection layer
    const items = rawItems
      .filter((r): r is typeof r & { beneficiary_id: number; beneficiary: NonNullable<typeof r.beneficiary> } =>
        r.beneficiary_id !== null && r.beneficiary !== null,
      )
      .map((r) => ({
        id: r.id,
        opportunity_id: r.opportunity_id,
        beneficiary_id: r.beneficiary_id,
        registered_at: r.created_at,
        beneficiary: {
          id: r.beneficiary.id,
          first_name: r.beneficiary.profiles?.first_name ?? null,
          last_name: r.beneficiary.profiles?.last_name ?? null,
        },
      }));

    return { items, total };
  },

  /**
   * Returns a paginated list of opportunity registrations belonging to the
   * authenticated beneficiary, ordered newest-first.
   *
   * The query is scoped strictly to beneficiary_id = userId; the endpoint
   * never accepts a client-supplied beneficiary_id.
   *
   * Opportunity status is NOT filtered — closed/published opportunities are
   * both included so historical registrations remain visible after closure.
   *
   * Company name is included to let the beneficiary identify who posted the
   * opportunity without exposing other company-private data.
   */
  async listMyRegistrations(
    userId: number,
    params: ListMyRegistrationsParams,
  ): Promise<{ items: Array<{
    id: number;
    opportunity_id: number;
    beneficiary_id: number | null;
    created_at: Date;
    opportunity: {
      id: number;
      title: string;
      status: string;
      type: string | null;
      domain_id: number | null;
      registration_deadline: Date | null;
      company: { id: number; name: string } | null;
    };
  }>; total: number }> {
    const where = { beneficiary_id: userId };
    const skip = (params.page - 1) * params.limit;

    const [items, total] = await Promise.all([
      prisma.opportunity_registrations.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: params.limit,
        select: {
          id: true,
          opportunity_id: true,
          beneficiary_id: true,
          created_at: true,
          opportunity: {
            select: {
              id: true,
              title: true,
              status: true,
              type: true,
              domain_id: true,
              registration_deadline: true,
              company: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.opportunity_registrations.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Returns the number of verified projects owned by the given user.
   * Used to enforce the eligibility rule that a beneficiary must have at
   * least one verified project before they can register for an opportunity.
   */
  async hasVerifiedProject(
    userId: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<boolean> {
    const count = await tx.projects.count({
      where: { user_id: userId, status: "verified" },
    });
    return count > 0;
  },

  /**
   * Creates an opportunity registration for the given beneficiary.
   * Catches Prisma P2002 (unique constraint on opportunity_id + beneficiary_id)
   * and re-throws it as HTTP 409 to surface a clean duplicate error.
   */
  async createRegistration(
    opportunityId: number,
    beneficiaryId: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<{ id: number; opportunity_id: number; beneficiary_id: number | null; created_at: Date }> {
    try {
      return await tx.opportunity_registrations.create({
        data: {
          opportunity_id: opportunityId,
          beneficiary_id: beneficiaryId,
        },
        select: {
          id: true,
          opportunity_id: true,
          beneficiary_id: true,
          created_at: true,
        },
      });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new AppError("You have already registered for this opportunity", 409);
      }
      throw err;
    }
  },
};
