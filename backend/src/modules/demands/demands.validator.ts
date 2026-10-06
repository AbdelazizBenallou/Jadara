import { z } from "zod";
import { DEMAND_ROLES } from "./demands.constants.js";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).*(?=.*\d)/;
const passwordMessage = "Must contain uppercase, lowercase, and number";

const coercedNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v.trim()) : v),
    schema,
  );

const domainIds = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const raw = Array.isArray(v) ? v : String(v).split(",");
  const nums = raw
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return nums.length > 0 ? [...new Set(nums)] : undefined;
}, z.array(z.number().int().positive()).optional());

const organizationDetails = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}, z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  website: z.string().url().max(500).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
}));

export const submitDemandSchema = z.object({
  // The requested role decides the role granted on approval.
  role: z.enum(DEMAND_ROLES),
  email: z.string().email().max(255),
  password: z.string().min(8).regex(passwordRegex, passwordMessage),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  // Required for Reviewer, ignored for the other demand roles.
  domain_ids: domainIds,
  // Required for Organization, ignored for the other demand roles.
  organization: organizationDetails.optional(),
});

export const listDemandsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  role: z.enum(DEMAND_ROLES).optional(),
});

export const reviewDemandSchema = z.object({
  note: z.string().max(1000).optional(),
});

export type SubmitDemandInput = z.infer<typeof submitDemandSchema>;
export type ListDemandsInput = z.infer<typeof listDemandsSchema>;
export type ReviewDemandInput = z.infer<typeof reviewDemandSchema>;