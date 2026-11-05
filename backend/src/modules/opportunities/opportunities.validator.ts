import { z } from "zod";

/**
 * Normalizes skill IDs from array or comma-separated string,
 * deduplicating and filtering positive integers.
 */
const normalizeSkillIds = (v: unknown): number[] => {
  if (v === undefined || v === null || v === "") return [];
  const raw = Array.isArray(v) ? v : String(v).split(",");
  const nums = raw
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(nums)];
};

const skillIdsSchema = z.preprocess(
  normalizeSkillIds,
  z.array(z.number().int().positive()).max(50),
);

/**
 * Validates date inputs, returning a Date instance or undefined/null.
 */
const dateField = z.union([
  z.date(),
  z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "registration_deadline must be a valid date",
    })
    .transform((v) => new Date(v)),
]);

/**
 * Normalizes skill IDs specifically for partial updates, preserving
 * undefined when the field is omitted by the client.
 */
const normalizeOptionalSkillIds = (v: unknown): number[] | undefined => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return [];
  const raw = Array.isArray(v) ? v : String(v).split(",");
  const nums = raw
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(nums)];
};

const optionalSkillIdsSchema = z.preprocess(
  normalizeOptionalSkillIds,
  z.array(z.number().int().positive()).max(50).optional(),
);

export const createOpportunityDraftSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title must not exceed 255 characters"),
    description: z.string().trim().max(5000).nullable().optional(),
    type: z.enum(["job", "internship", "project_freelance"]).nullable().optional(),
    domain_id: z.number().int().positive().nullable().optional(),
    sub_domain_id: z.number().int().positive().nullable().optional(),
    registration_deadline: dateField.nullable().optional(),
    required_skill_ids: skillIdsSchema.optional(),

    // Explicitly disallow client from supplying status or company_id
    company_id: z.never({
      message: "company_id cannot be supplied by the client",
    }).optional(),
    status: z.never({
      message: "status cannot be set directly; new opportunities are created as draft",
    }).optional(),
  })
  .strict();

export type CreateOpportunityDraftInput = z.infer<typeof createOpportunityDraftSchema>;

export const updateOpportunitySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title must not exceed 255 characters")
      .optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    type: z.enum(["job", "internship", "project_freelance"]).nullable().optional(),
    domain_id: z.number().int().positive().nullable().optional(),
    sub_domain_id: z.number().int().positive().nullable().optional(),
    registration_deadline: dateField.nullable().optional(),
    required_skill_ids: optionalSkillIdsSchema,

    // Disallow client from supplying status or company_id
    company_id: z.never({
      message: "company_id cannot be supplied by the client",
    }).optional(),
    status: z.never({
      message: "status cannot be updated directly; use dedicated lifecycle actions",
    }).optional(),
  })
  .strict()
  .refine(
    (data) => {
      const updatableKeys: (keyof typeof data)[] = [
        "title",
        "description",
        "type",
        "domain_id",
        "sub_domain_id",
        "registration_deadline",
        "required_skill_ids",
      ];
      return updatableKeys.some((k) => data[k] !== undefined);
    },
    { message: "At least one field must be provided for update" },
  );

export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;

export const listOpportunitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["draft", "published", "closed"]).optional(),
});

export type ListOpportunitiesQuery = z.infer<typeof listOpportunitiesQuerySchema>;

/**
 * Query schema for the public browse endpoint (GET /v1/opportunities/published).
 * Status is intentionally excluded — the endpoint always returns only published rows.
 */
export const browsePublishedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  domain_id: z.coerce.number().int().positive().optional(),
  type: z.enum(["job", "internship", "project_freelance"]).optional(),
  q: z.string().trim().max(100).optional(),
});

export type BrowsePublishedQuery = z.infer<typeof browsePublishedQuerySchema>;

/**
 * Query schema for the beneficiary's own registrations endpoint
 * (GET /v1/opportunities/registrations/mine).
 * Status filter is intentionally excluded — all statuses are returned so
 * historical registrations remain visible after opportunity closure.
 */
export const listMyRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListMyRegistrationsQuery = z.infer<typeof listMyRegistrationsQuerySchema>;

/**
 * Query schema for the Company's view of registrants for one of their opportunities
 * (GET /v1/opportunities/:id/registrants).
 * Status filter is intentionally absent — registrations for closed opportunities
 * are included for historical visibility.
 */
export const listOpportunityRegistrantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListOpportunityRegistrantsQuery = z.infer<typeof listOpportunityRegistrantsQuerySchema>;
