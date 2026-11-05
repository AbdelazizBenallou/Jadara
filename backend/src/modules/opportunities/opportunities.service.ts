import prisma from "../../../framework/config/prisma.js";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../../framework/utils/AppError.js";
import {
  opportunityRepository,
  type OpportunityWithRelations,
  type BrowsePublishedParams,
  type ListMyRegistrationsParams,
  type ListOpportunityRegistrantsParams,
} from "./opportunities.repository.js";

import type {
  CreateOpportunityDraftInput,
  ListOpportunitiesQuery,
  UpdateOpportunityInput,
  BrowsePublishedQuery,
  ListMyRegistrationsQuery,
  ListOpportunityRegistrantsQuery,
} from "./opportunities.validator.js";

/**
 * Returns the current authoritative server time in milliseconds.
 * Centralised so tests can spy on it without touching Date globally.
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Maps an opportunity database payload to a clean API projection.
 * Exposes registration counts and registration_open availability flag
 * while strictly omitting any beneficiary PII.
 */
function mapOpportunity(o: OpportunityWithRelations) {
  const deadlineInFuture =
    o.registration_deadline !== null &&
    o.registration_deadline !== undefined &&
    o.registration_deadline.getTime() > Date.now();
  const companyActive = !(o.company?.is_removed ?? false);

  return {
    id: o.id,
    company_id: o.company_id,
    company_name: o.company?.name ?? null,
    title: o.title,
    status: o.status,
    description: o.description,
    type: o.type,
    domain_id: o.domain_id,
    domain: o.domain ? { id: o.domain.id, name: o.domain.name } : null,
    sub_domain_id: o.sub_domain_id,
    sub_domain: o.sub_domain
      ? {
          id: o.sub_domain.id,
          name: o.sub_domain.name,
          domain_id: o.sub_domain.domain_id,
        }
      : null,
    registration_deadline: o.registration_deadline,
    registration_open: deadlineInFuture && companyActive,
    required_skills: (o.required_skills ?? []).map((link) => ({
      id: link.skill.id,
      name: link.skill.name,
      category_id: link.skill.category_id,
    })),
    registrations_count: o._count?.registrations ?? 0,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

export type OpportunityView = ReturnType<typeof mapOpportunity>;

/**
 * Resolves the authenticated company profile and validates it is active.
 * Throws 404 if no company profile exists, 403 if marked removed.
 */
async function resolveActiveCompany(userId: number) {
  const company = await opportunityRepository.findCompanyByUserId(userId);
  if (!company) {
    throw new AppError("Company profile not found", 404);
  }
  if (company.is_removed) {
    throw new AppError("Company account has been removed", 403);
  }
  return company;
}

export const opportunityService = {
  map: mapOpportunity,

  /**
   * Returns a paginated list of published opportunities visible to all authenticated users.
   * Hard-codes status = 'published'; callers cannot filter by other statuses.
   * Optionally filters by domain_id, opportunity type, and title keyword (case-insensitive).
   * Each row includes a `registration_open` flag computed from:
   *   - registration_deadline is non-null and strictly in the future
   *   - the owning company has not been removed
   * Visible opportunities are never hidden solely because registration is unavailable;
   * the flag simply signals whether a beneficiary can register right now.
   */
  async browse(query: BrowsePublishedQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const params: BrowsePublishedParams = {
      page,
      limit,
      domain_id: query.domain_id,
      type: query.type,
      q: query.q,
    };

    const { items, total } = await opportunityRepository.listPublished(params);
    const totalPages = Math.ceil(total / limit);

    return {
      opportunities: items.map(mapOpportunity),
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  /**
   * Creates a new opportunity draft owned by the authenticated company.
   * Only title is required; other fields remain optional for drafts.
   */
  async createDraft(userId: number, data: CreateOpportunityDraftInput): Promise<OpportunityView> {
    const company = await resolveActiveCompany(userId);

    // Validate optional domain existence if provided
    if (data.domain_id) {
      const domain = await opportunityRepository.findDomainById(data.domain_id);
      if (!domain) {
        throw new AppError("Selected domain does not exist", 400);
      }
    }

    // Validate optional sub-domain existence and domain consistency if provided
    if (data.sub_domain_id) {
      const subDomain = await opportunityRepository.findSubDomainById(data.sub_domain_id);
      if (!subDomain) {
        throw new AppError("Selected sub-domain does not exist", 400);
      }
      if (data.domain_id && subDomain.domain_id !== data.domain_id) {
        throw new AppError("Sub-domain does not belong to the selected domain", 400);
      }
    }

    // Validate optional skills if provided
    if (data.required_skill_ids && data.required_skill_ids.length > 0) {
      const existing = new Set(
        await opportunityRepository.findExistingSkillIds(data.required_skill_ids),
      );
      const missing = data.required_skill_ids.filter((id) => !existing.has(id));
      if (missing.length > 0) {
        throw new AppError("Some selected skills do not exist", 400, true, {
          missing_skills: missing,
        });
      }
    }

    const created = await opportunityRepository.createDraft(company.id, data);
    return mapOpportunity(created);
  },

  /**
   * Lists opportunities owned by the authenticated company.
   */
  async listMine(userId: number, query: ListOpportunitiesQuery) {
    const company = await resolveActiveCompany(userId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { items, total } = await opportunityRepository.listOwned(company.id, {
      page,
      limit,
      status: query.status,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      opportunities: items.map(mapOpportunity),
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  /**
   * Retrieves a single opportunity owned by the authenticated company.
   * Scoped strictly by company_id to prevent enumeration.
   */
  async getMineById(userId: number, opportunityId: number): Promise<OpportunityView> {
    const company = await resolveActiveCompany(userId);

    const opportunity = await opportunityRepository.findById(opportunityId);
    if (!opportunity || opportunity.company_id !== company.id) {
      throw new AppError("Opportunity not found", 404);
    }

    return mapOpportunity(opportunity);
  },

  /**
   * Deletes a draft opportunity.
   * Enforces:
   * 1. Ownership by authenticated company.
   * 2. Status must be strictly 'draft' (rejects published/closed with 409).
   * 3. Registrations count must be 0 (rejects with 409 if any registration exists).
   * 4. Atomic conditional delete preventing race conditions against concurrent
   *    publishing or concurrent registrations.
   */
  async deleteDraft(userId: number, opportunityId: number): Promise<void> {
    const company = await resolveActiveCompany(userId);

    const existing = await opportunityRepository.findById(opportunityId);
    if (!existing || existing.company_id !== company.id) {
      throw new AppError("Opportunity not found", 404);
    }

    if (existing.status !== "draft") {
      throw new AppError("Only draft opportunities can be deleted", 409);
    }

    if ((existing._count?.registrations ?? 0) > 0) {
      throw new AppError("Cannot delete opportunity with existing registrations", 409);
    }

    // Atomic conditional delete enforcing company_id, status = 'draft', and registrations: { none: {} }
    const deletedCount = await opportunityRepository.deleteDraft(company.id, opportunityId);

    // If deletedCount is 0, a concurrent modification occurred between read and delete
    if (deletedCount === 0) {
      const current = await opportunityRepository.findById(opportunityId);
      if (!current || current.company_id !== company.id) {
        throw new AppError("Opportunity not found", 404);
      }
      if (current.status !== "draft") {
        throw new AppError("Only draft opportunities can be deleted", 409);
      }
      if ((current._count?.registrations ?? 0) > 0) {
        throw new AppError("Cannot delete opportunity with existing registrations", 409);
      }
      throw new AppError("Opportunity cannot be deleted in its current state", 409);
    }
  },

  /**
   * Updates an owned opportunity.
   * Enforces:
   * 1. Resolves active Company from authenticated user (404 if missing, 403 if removed).
   * 2. Scoped to company ownership (404 for missing or owned by another company).
   * 3. Row-level exclusive lock (SELECT ... FOR UPDATE) inside interactive transaction
   *    to eliminate race conditions with concurrent registration creation.
   * 4. Rejects updates to 'closed' opportunities with 409 Conflict.
   * 5. Field freezing when registration count > 0 (including anonymous registrations):
   *    freezes type, domain_id, sub_domain_id, required_skill_ids (409 Conflict).
   *    Allows title, description, and deadline changes if strictly in future.
   * 6. Validates taxonomy references and enforces Domain/Sub-domain integrity.
   * 7. Supports partial updates, distinguishing omitted from supplied fields.
   */
  async update(
    userId: number,
    opportunityId: number,
    data: UpdateOpportunityInput,
  ): Promise<OpportunityView> {
    const company = await resolveActiveCompany(userId);

    return prisma.$transaction(async (tx) => {
      // 1. Acquire exclusive row lock and fetch latest opportunity state
      const opportunity = await opportunityRepository.findForUpdate(opportunityId, tx);
      if (!opportunity || opportunity.company_id !== company.id) {
        throw new AppError("Opportunity not found", 404);
      }

      // 2. Reject terminal closed state
      if (opportunity.status === "closed") {
        throw new AppError("Closed opportunities cannot be updated", 409);
      }

      const registrationCount = opportunity._count?.registrations ?? 0;

      // 3. Field freezing enforcement when at least one registration exists
      if (registrationCount > 0) {
        const hasFrozenField =
          data.type !== undefined ||
          data.domain_id !== undefined ||
          data.sub_domain_id !== undefined ||
          data.required_skill_ids !== undefined;

        if (hasFrozenField) {
          throw new AppError(
            "Cannot modify frozen fields (type, domain, sub-domain, required skills) after registrations exist",
            409,
          );
        }

        if (data.registration_deadline !== undefined) {
          if (
            !data.registration_deadline ||
            data.registration_deadline.getTime() <= Date.now()
          ) {
            throw new AppError(
              "Registration deadline must be strictly later than current server time",
              400,
            );
          }
        }
      }

      // 4. Validate taxonomy references if supplied
      const isDomainUpdated = data.domain_id !== undefined;
      const isSubDomainUpdated = data.sub_domain_id !== undefined;

      if (isDomainUpdated || isSubDomainUpdated) {
        if (data.domain_id !== undefined && data.domain_id !== null) {
          const domain = await opportunityRepository.findDomainById(data.domain_id, tx);
          if (!domain) {
            throw new AppError("Selected domain does not exist", 400);
          }
        }

        const effectiveDomainId =
          data.domain_id !== undefined ? data.domain_id : opportunity.domain_id;
        const effectiveSubDomainId =
          data.sub_domain_id !== undefined ? data.sub_domain_id : opportunity.sub_domain_id;

        if (effectiveSubDomainId !== null && effectiveSubDomainId !== undefined) {
          const subDomain = await opportunityRepository.findSubDomainById(effectiveSubDomainId, tx);
          if (!subDomain) {
            throw new AppError("Selected sub-domain does not exist", 400);
          }
          if (effectiveDomainId === null || subDomain.domain_id !== effectiveDomainId) {
            throw new AppError("Sub-domain does not belong to the selected domain", 400);
          }
        }
      }

      if (data.required_skill_ids !== undefined && data.required_skill_ids.length > 0) {
        const existing = new Set(
          await opportunityRepository.findExistingSkillIds(data.required_skill_ids, tx),
        );
        const missing = data.required_skill_ids.filter((id) => !existing.has(id));
        if (missing.length > 0) {
          throw new AppError("Some selected skills do not exist", 400, true, {
            missing_skills: missing,
          });
        }
      }

      // 5. Construct partial update payload
      const updatePayload: Prisma.opportunitiesUncheckedUpdateInput = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.domain_id !== undefined ? { domain_id: data.domain_id } : {}),
        ...(data.sub_domain_id !== undefined ? { sub_domain_id: data.sub_domain_id } : {}),
        ...(data.registration_deadline !== undefined
          ? { registration_deadline: data.registration_deadline }
          : {}),
        updated_at: new Date(),
      };

      const updated = await opportunityRepository.updateOpportunity(
        opportunityId,
        updatePayload,
        data.required_skill_ids,
        tx,
      );

      return mapOpportunity(updated);
    });
  },

  /**
   * Publishes an owned draft opportunity.
   * Enforces:
   * 1. Resolves active Company from authenticated user (404 if missing, 403 if removed).
   * 2. Scoped to company ownership (404 for missing or owned by another company).
   * 3. Row-level exclusive lock (SELECT ... FOR UPDATE via $queryRaw) inside interactive
   *    transaction to eliminate races with concurrent updates or registration creation.
   * 4. Only draft opportunities may be published — any other state returns 409 Conflict.
   * 5. Validates all seven required attributes before state transition:
   *    title, description, type, domain_id, sub_domain_id, required skills, deadline.
   * 6. At least one required skill must be present.
   * 7. Registration deadline must be strictly later than authoritative server time.
   * 8. Sub-domain must belong to the selected domain; all taxonomy refs must exist.
   * 9. On success, transitions status to 'published' and returns the mapped view.
   */
  async publish(userId: number, opportunityId: number): Promise<OpportunityView> {
    const company = await resolveActiveCompany(userId);

    return prisma.$transaction(async (tx) => {
      // 1. Acquire exclusive row lock, then fetch latest opportunity state with relations
      const opportunity = await opportunityRepository.findForUpdate(opportunityId, tx);
      if (!opportunity || opportunity.company_id !== company.id) {
        throw new AppError("Opportunity not found", 404);
      }

      // 2. Only draft opportunities can be published
      if (opportunity.status !== "draft") {
        throw new AppError("Only draft opportunities can be published", 409);
      }

      // 3. Validate all seven required attributes

      // 3a. Title (non-empty string — always present per schema, but guard nullish)
      if (!opportunity.title || opportunity.title.trim().length === 0) {
        throw new AppError("Opportunity must have a title before publishing", 400);
      }

      // 3b. Description
      if (!opportunity.description || opportunity.description.trim().length === 0) {
        throw new AppError("Opportunity must have a description before publishing", 400);
      }

      // 3c. Opportunity type
      if (!opportunity.type) {
        throw new AppError("Opportunity must have a type before publishing", 400);
      }

      // 3d. Domain
      if (!opportunity.domain_id) {
        throw new AppError("Opportunity must have a domain before publishing", 400);
      }

      // 3e. Sub-domain
      if (!opportunity.sub_domain_id) {
        throw new AppError("Opportunity must have a sub-domain before publishing", 400);
      }

      // 3f. Required skills — at least one valid entry
      const skillCount = opportunity.required_skills?.length ?? 0;
      if (skillCount === 0) {
        throw new AppError(
          "Opportunity must have at least one required skill before publishing",
          400,
        );
      }

      // 3g. Registration deadline — must be strictly in the future
      if (!opportunity.registration_deadline) {
        throw new AppError(
          "Opportunity must have a registration deadline before publishing",
          400,
        );
      }
      const serverNow = nowMs();
      if (opportunity.registration_deadline.getTime() <= serverNow) {
        throw new AppError(
          "Registration deadline must be strictly later than current server time",
          400,
        );
      }

      // 4. Validate taxonomy integrity from persisted values (domain and sub-domain must exist
      //    and sub-domain must belong to the selected domain). The foreign-key constraint on the
      //    schema guarantees these rows exist, but we re-validate inside the transaction so the
      //    lock is held while we read, giving a consistent view.
      const domain = await opportunityRepository.findDomainById(opportunity.domain_id, tx);
      if (!domain) {
        throw new AppError("Selected domain does not exist", 400);
      }

      const subDomain = await opportunityRepository.findSubDomainById(
        opportunity.sub_domain_id,
        tx,
      );
      if (!subDomain) {
        throw new AppError("Selected sub-domain does not exist", 400);
      }
      if (subDomain.domain_id !== opportunity.domain_id) {
        throw new AppError("Sub-domain does not belong to the selected domain", 400);
      }

      // 5. Transition to published
      const published = await opportunityRepository.updateOpportunity(
        opportunityId,
        { status: "published", updated_at: new Date() },
        undefined, // do not touch skills join table
        tx,
      );

      return mapOpportunity(published);
    });
  },

  /**
   * Closes an owned opportunity, transitioning it to the 'closed' terminal state.
   * Enforces:
   * 1. Resolves active Company from authenticated user (404 if missing, 403 if removed).
   * 2. Scoped to company ownership (404 for missing or owned by another company).
   * 3. Row-level exclusive lock (SELECT ... FOR UPDATE via $queryRaw) inside interactive
   *    transaction to eliminate races with concurrent updates, publish, or registrations.
   * 4. Allowed source states: 'draft' and 'published'. Both may be closed directly.
   * 5. Returns 409 Conflict if the opportunity is already 'closed'.
   * 6. Does not modify required skills or registrations — only flips status to 'closed'.
   * 7. Existing registrations and historical records are fully preserved.
   * 8. No deadline rule applies to closing.
   */
  async close(userId: number, opportunityId: number): Promise<OpportunityView> {
    const company = await resolveActiveCompany(userId);

    return prisma.$transaction(async (tx) => {
      // 1. Acquire exclusive row lock, then fetch latest opportunity state with relations
      const opportunity = await opportunityRepository.findForUpdate(opportunityId, tx);
      if (!opportunity || opportunity.company_id !== company.id) {
        throw new AppError("Opportunity not found", 404);
      }

      // 2. Reject already-closed opportunities (terminal → terminal is not permitted)
      if (opportunity.status === "closed") {
        throw new AppError("Opportunity is already closed", 409);
      }

      // 3. Transition to closed — both draft and published are valid source states.
      //    Only status and updated_at are written; skills and registrations are untouched.
      const closed = await opportunityRepository.updateOpportunity(
        opportunityId,
        { status: "closed", updated_at: new Date() },
        undefined, // do not touch skills join table
        tx,
      );

      return mapOpportunity(closed);
    });
  },

  /**
   * Returns a paginated list of non-anonymous registrants for the specified
   * opportunity, scoped to the authenticated Company owner.
   *
   * Ownership is enforced identically to getMineById:
   * - resolveActiveCompany resolves and validates the caller's Company.
   * - A 404 is returned if the opportunity doesn't exist or belongs to
   *   a different Company, preventing enumeration across tenants.
   *
   * Anonymous registrations (beneficiary_id = null) are excluded from the
   * returned list; they are preserved in the database and counted separately.
   *
   * Historical visibility: registrations for closed/expired opportunities
   * are returned without filtering by opportunity status.
   *
   * PII projection deliberately limited to: id, first_name, last_name.
   * Email, skills, education, and full-profile data belong to Talent Discovery (search_talent)
   * or require explicit beneficiary consent to share.
   */
  async listOpportunityRegistrants(
    userId: number,
    opportunityId: number,
    query: ListOpportunityRegistrantsQuery,
  ) {
    const company = await resolveActiveCompany(userId);

    const opportunity = await opportunityRepository.findById(opportunityId);
    if (!opportunity || opportunity.company_id !== company.id) {
      throw new AppError("Opportunity not found", 404);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const params: ListOpportunityRegistrantsParams = { page, limit };
    const { items, total } = await opportunityRepository.listOpportunityRegistrants(
      opportunityId,
      params,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      registrants: items.map((r) => ({
        id: r.id,
        opportunity_id: r.opportunity_id,
        registered_at: r.registered_at,
        beneficiary: {
          id: r.beneficiary.id,
          first_name: r.beneficiary.first_name,
          last_name: r.beneficiary.last_name,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  /**
   * Returns a paginated list of the authenticated beneficiary's own registrations.
   * Scoped strictly to beneficiary_id = userId; the client cannot supply an
   * alternative identity.
   *
   * Opportunity status is NOT filtered: closed/published opportunities are both
   * returned so historical registrations remain visible after closure, deadline
   * expiry, or company deactivation.
   *
   * Projection is PII-safe: no beneficiary profile data, no Company-private
   * registration lists, no other registrants' information.
   */
  async listMyRegistrations(userId: number, query: ListMyRegistrationsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const params: ListMyRegistrationsParams = { page, limit };
    const { items, total } = await opportunityRepository.listMyRegistrations(userId, params);
    const totalPages = Math.ceil(total / limit);

    return {
      registrations: items.map((r) => ({
        id: r.id,
        opportunity_id: r.opportunity_id,
        registered_at: r.created_at,
        opportunity: r.opportunity
          ? {
              id: r.opportunity.id,
              title: r.opportunity.title,
              status: r.opportunity.status,
              type: r.opportunity.type,
              domain_id: r.opportunity.domain_id,
              registration_deadline: r.opportunity.registration_deadline,
              company: r.opportunity.company
                ? { id: r.opportunity.company.id, name: r.opportunity.company.name }
                : null,
            }
          : null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  /**
   * Registers the authenticated beneficiary for a published opportunity.
   *
   * Guards (all checked inside a single exclusive-locked transaction):
   * 1. Opportunity must exist and be status='published' → 404 otherwise.
   * 2. Owning Company must not be removed → 409 ("Company is no longer active").
   * 3. Registration deadline must be non-null and strictly in the future → 400.
   * 4. Beneficiary must have at least one verified project → 403.
   * 5. Duplicate registration (same beneficiary + opportunity) → 409 via P2002.
   *
   * The beneficiary identity is always resolved from req.user; the client
   * cannot supply beneficiary_id. Anonymous registration records and their
   * counting/freeze semantics are unaffected.
   */
  async register(
    userId: number,
    opportunityId: number,
  ): Promise<{ id: number; opportunity_id: number; beneficiary_id: number | null; created_at: Date }> {
    return prisma.$transaction(async (tx) => {
      // 1. Acquire exclusive row lock on the opportunity row before any check.
      //    This prevents concurrent publish/close/update from invalidating
      //    the status, deadline, or company state between our read and write.
      const opportunity = await opportunityRepository.findForUpdate(opportunityId, tx);

      if (!opportunity || opportunity.status !== "published") {
        throw new AppError("Opportunity not found or not available for registration", 404);
      }

      // 2. Owning company must still be active.
      if (opportunity.company?.is_removed) {
        throw new AppError("This opportunity is no longer available (company inactive)", 409);
      }

      // 3. Registration deadline must be set and strictly in the future.
      if (
        opportunity.registration_deadline === null ||
        opportunity.registration_deadline === undefined ||
        opportunity.registration_deadline.getTime() <= Date.now()
      ) {
        throw new AppError("Registration deadline has passed", 400);
      }

      // 4. Beneficiary eligibility: must have at least one verified project.
      const eligible = await opportunityRepository.hasVerifiedProject(userId, tx);
      if (!eligible) {
        throw new AppError(
          "You must have at least one verified project to register for an opportunity",
          403,
        );
      }

      // 5. Create registration — P2002 unique constraint maps to 409 duplicate.
      return opportunityRepository.createRegistration(opportunityId, userId, tx);
    });
  },
};
