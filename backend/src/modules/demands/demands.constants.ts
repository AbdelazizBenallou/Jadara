// Shared registration-demand rules.
//
// The three applicant-facing actors (Reviewer, Company, Organization) run
// through one single demand workflow: the requested role is what the Admin
// grants on approval, so there is no per-role approval system.

export const DEMAND_ROLES = ["Reviewer", "Company", "Organization"] as const;

// Only Beneficiary is available through the public registration endpoint.
export const DIRECT_REGISTRATION_ROLES = ["Beneficiary"] as const;

export type DemandRole = (typeof DEMAND_ROLES)[number];

export type DirectRegistrationRole = (typeof DIRECT_REGISTRATION_ROLES)[number];

export function isDemandRole(value: string): value is DemandRole {
  return (DEMAND_ROLES as readonly string[]).includes(value);
}

export function isDirectRegistrationRole(value: string): value is DirectRegistrationRole {
  return (DIRECT_REGISTRATION_ROLES as readonly string[]).includes(value);
}