import { z } from "zod";

export const createDomainSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateDomainSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const listDomainsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const assignSkillSchema = z
  .object({
    skill_id: z.number().int().positive().optional(),
    skill_ids: z.array(z.number().int().positive()).min(1).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.skill_id !== undefined && data.skill_ids !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["skill_id"],
        message: "Provide either skill_id or skill_ids, not both",
      });
    }
    if (data.skill_id === undefined && data.skill_ids === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["skill_id"],
        message: "Either skill_id or skill_ids is required",
      });
    }
  })
  .transform((data): { skill_ids: number[] } => ({
    skill_ids: [...new Set(data.skill_ids ?? [data.skill_id!])],
  }));

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type AssignSkillInput = z.infer<typeof assignSkillSchema>;

export const createSubDomainSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  domain_id: z.number().int().positive(),
});

export const updateSubDomainSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  domain_id: z.number().int().positive().optional(),
});

export const listSubDomainsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  domain_id: z.string().optional(),
});

export type CreateSubDomainInput = z.infer<typeof createSubDomainSchema>;
export type UpdateSubDomainInput = z.infer<typeof updateSubDomainSchema>;

