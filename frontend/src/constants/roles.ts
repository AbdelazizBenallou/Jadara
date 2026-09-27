export const ROLES = {
  BENEFICIARY: "beneficiary",
  REVIEWER: "reviewer",
  COMPANY: "company",
  ADMIN: "admin",
  TRAINER: "trainer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HOME: Record<Role, string> = {
  beneficiary: "/dashboard",
  reviewer: "/reviewer",
  company: "/company",
  admin: "/admin",
  trainer: "/unsupported",
};
