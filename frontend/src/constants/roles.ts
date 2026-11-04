export const ROLES = {
  BENEFICIARY: "beneficiary",
  REVIEWER: "reviewer",
  COMPANY: "company",
  ORGANIZATION: "organization",
  ADMIN: "admin",
  TRAINER: "trainer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HOME: Record<Role, string> = {
  beneficiary: "/",
  organization: "/",
  reviewer: "/",
  company: "/",
  admin: "/admin",
  trainer: "/unsupported",
};
