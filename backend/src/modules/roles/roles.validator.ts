import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(50),
});

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updatePermissionSchema = z.object({
  name: z.string().min(1).max(100),
});

export const assignPermissionSchema = z.object({
  permission_id: z.number().int().positive(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
