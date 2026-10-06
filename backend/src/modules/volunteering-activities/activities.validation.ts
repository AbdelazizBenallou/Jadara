import { z } from "zod";

/**
 * Multipart sends everything as text and repeats array fields as
 * `required_skill_ids[]` (multer's append-field normalises that to
 * `required_skill_ids`). Accept a JSON array, a comma separated string, a
 * single value, or repeated fields.
 */
const normalizeSkillIds = (v: unknown): number[] => {
  if (v === undefined || v === null || v === "") return [];
  const raw = Array.isArray(v) ? v : String(v).split(",");
  const nums = raw
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(nums)];
};

const skillIds = z.preprocess(
  normalizeSkillIds,
  z.array(z.number().int().positive()).max(100),
);

const coercedInt = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v.trim()) : v),
    schema,
  );

const dateField = (label: string) =>
  z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: `${label} must be a valid date` })
    .transform((v) => new Date(v));

// Status is intentionally accepted only so the service can reject it: an
// Organization must not be able to publish its own activity.
const statusForbidden = z
  .enum(["pending_review", "published", "rejected", "ongoing", "completed", "cancelled"])
  .optional()
  .refine((v) => v === undefined, {
    message: "Activity status can only be changed through Admin review",
  });

const dateOrder = <T extends { start_date?: Date; end_date?: Date }>(data: T, ctx: z.RefinementCtx) => {
  if (data.start_date && data.end_date && data.start_date > data.end_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["end_date"],
      message: "end_date must be on or after start_date",
    });
  }
};

export const createActivitySchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().max(5000).optional(),
    location: z.string().max(255).optional(),
    start_date: dateField("start_date"),
    end_date: dateField("end_date"),
    capacity: coercedInt(z.number().int().positive()),
    requirements: z.string().max(5000).optional(),
    registration_deadline: dateField("registration_deadline").optional(),
    category_id: coercedInt(z.number().int().positive()).optional(),
    required_skill_ids: skillIds.optional(),
    status: statusForbidden,
  })
  .superRefine(dateOrder);

export const updateActivitySchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    location: z.string().max(255).nullable().optional(),
    start_date: dateField("start_date").optional(),
    end_date: dateField("end_date").optional(),
    capacity: coercedInt(z.number().int().positive()).optional(),
    requirements: z.string().max(5000).nullable().optional(),
    registration_deadline: dateField("registration_deadline").nullable().optional(),
    category_id: coercedInt(z.number().int().positive()).nullable().optional(),
    status: statusForbidden,
  })
  .superRefine(dateOrder);

export const addSkillsSchema = z.object({
  required_skill_ids: z.preprocess(
    normalizeSkillIds,
    z.array(z.number().int().positive()).min(1).max(100),
  ),
});

export const listActivitiesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["pending_review", "published", "rejected", "ongoing", "completed", "cancelled"]).optional(),
  q: z.string().max(255).optional(),
});

export const reviewActivitySchema = z.object({
  note: z.string().max(1000).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ListActivitiesInput = z.infer<typeof listActivitiesSchema>;
export type ReviewActivityInput = z.infer<typeof reviewActivitySchema>;
