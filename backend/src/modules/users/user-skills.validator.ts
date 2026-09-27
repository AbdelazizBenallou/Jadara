import { z } from "zod";
import { SkillLevel } from "@prisma/client";

export const skillLevelSchema = z.nativeEnum(SkillLevel);

export const addUserSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        skill_id: z.number().int().positive(),
        level: skillLevelSchema,
      }),
    )
    .min(1)
    .max(50),
});

export const updateSkillLevelSchema = z.object({
  level: skillLevelSchema,
});

export type AddUserSkillsInput = z.infer<typeof addUserSkillsSchema>;
export type UpdateSkillLevelInput = z.infer<typeof updateSkillLevelSchema>;
