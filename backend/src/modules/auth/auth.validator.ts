import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const passwordMessage = "Must contain uppercase, lowercase, and number";

const coercedNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() !== "" ? Number(v.trim()) : v), schema);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(passwordRegex, passwordMessage),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  role_id: coercedNumber(z.number().int().positive()),
  domain_ids: z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const raw = Array.isArray(v) ? v : String(v).split(",");
    const nums = raw
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    return nums.length > 0 ? [...new Set(nums)] : undefined;
  }, z.array(z.number().int().positive()).optional()),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(passwordRegex, passwordMessage),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
