import { describe, it, expect, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  PERMISSION_NAMES,
  BASELINE_ROLE_PERMISSIONS,
  ROLE_NAMES,
  seedPermissions,
  seedRoles,
  seedRolePermissions,
  type Permission,
  type Role,
} from "../../prisma/seed_users.js";

describe("RBAC Seed Logic — Zero-Database Unit Tests", () => {
  const COMPANY_PERMISSIONS = [
    "view_company_profile",
    "create_opportunity",
    "view_own_opportunities",
    "update_opportunity",
    "publish_opportunity",
    "close_opportunity",
    "delete_opportunity",
    "view_opportunity_registrations",
    "search_talent",
    "browse_opportunities",
    "register_opportunity",
    "view_own_registrations",
    "manage_companies",
  ];

  const BASELINE_PERMISSIONS = [
    // Users / Roles / Permissions
    "manage_users",
    "manage_roles",
    "manage_permissions",
    "view_users",
    "update_profile",
    // Domains
    "view_domains",
    "create_domain",
    "update_domain",
    "delete_domain",
    // Skills
    "view_skills",
    "create_skill",
    "update_skill",
    "delete_skill",
    // Projects
    "create_project",
    "review_projects",
    "manage_projects",
    // Documents
    "create_document",
    "delete_document",
    "view_own_documents",
    // Organizations
    "view_organizations",
    "update_organization",
    "delete_organization",
    // Volunteering Activities
    "view_activities",
    "create_activity",
    "update_activity",
    "delete_activity",
    "approve_activity",
    "manage_activity_categories",
    // Volunteer Applications
    "view_applications",
    "accept_application",
    "reject_application",
    "apply_to_activity",
    "view_own_applications",
    // Volunteering Completion
    "confirm_completion",
    // Public published-activities feed
    "view_published_activities",
  ];

  describe("Permission Catalog Integrity", () => {
    it("contains all 35 pre-existing baseline permissions", () => {
      for (const perm of BASELINE_PERMISSIONS) {
        expect(PERMISSION_NAMES).toContain(perm);
      }
      expect(BASELINE_PERMISSIONS.length).toBe(35);
    });

    it("contains all 13 Company System permissions", () => {
      for (const perm of COMPANY_PERMISSIONS) {
        expect(PERMISSION_NAMES).toContain(perm);
      }
      expect(COMPANY_PERMISSIONS.length).toBe(13);
    });

    it("has exact total count of 48 permissions with no duplicates", () => {
      expect(PERMISSION_NAMES.length).toBe(48);
      const uniqueNames = new Set(PERMISSION_NAMES);
      expect(uniqueNames.size).toBe(48);
    });
  });

  describe("Approved Role-Permission Mappings", () => {
    it("Beneficiary preserves all 10 baseline permissions plus the 3 approved Company additions", () => {
      const perms = BASELINE_ROLE_PERMISSIONS.Beneficiary;
      expect(perms).toBeDefined();

      // Preserved baseline permissions
      expect(perms).toContain("update_profile");
      expect(perms).toContain("view_domains");
      expect(perms).toContain("view_skills");
      expect(perms).toContain("create_project");
      expect(perms).toContain("create_document");
      expect(perms).toContain("delete_document");
      expect(perms).toContain("view_own_documents");
      expect(perms).toContain("view_published_activities");
      expect(perms).toContain("apply_to_activity");
      expect(perms).toContain("view_own_applications");

      // Approved Company additions
      expect(perms).toContain("browse_opportunities");
      expect(perms).toContain("register_opportunity");
      expect(perms).toContain("view_own_registrations");

      // Strictly does not have unapproved permissions
      expect(perms).not.toContain("search_talent");
      expect(perms).not.toContain("create_opportunity");
      expect(perms).not.toContain("manage_companies");

      expect(perms.length).toBe(13);
    });

    it("Reviewer preserves all 5 baseline permissions plus browse_opportunities", () => {
      const perms = BASELINE_ROLE_PERMISSIONS.Reviewer;
      expect(perms).toBeDefined();

      // Preserved baseline permissions
      expect(perms).toContain("update_profile");
      expect(perms).toContain("view_domains");
      expect(perms).toContain("view_skills");
      expect(perms).toContain("review_projects");
      expect(perms).toContain("view_published_activities");

      // Approved Company addition
      expect(perms).toContain("browse_opportunities");

      // Strictly does not have unapproved permissions
      expect(perms).not.toContain("search_talent");
      expect(perms).not.toContain("create_opportunity");
      expect(perms).not.toContain("register_opportunity");
      expect(perms).not.toContain("manage_companies");

      expect(perms.length).toBe(6);
    });

    it("Company preserves all 4 baseline permissions plus 10 approved Company permissions", () => {
      const perms = BASELINE_ROLE_PERMISSIONS.Company;
      expect(perms).toBeDefined();

      // Preserved baseline permissions
      expect(perms).toContain("update_profile");
      expect(perms).toContain("view_domains");
      expect(perms).toContain("view_skills");
      expect(perms).toContain("view_published_activities");

      // Approved Company permissions
      expect(perms).toContain("view_company_profile");
      expect(perms).toContain("create_opportunity");
      expect(perms).toContain("view_own_opportunities");
      expect(perms).toContain("update_opportunity");
      expect(perms).toContain("publish_opportunity");
      expect(perms).toContain("close_opportunity");
      expect(perms).toContain("delete_opportunity");
      expect(perms).toContain("view_opportunity_registrations");
      expect(perms).toContain("search_talent");
      expect(perms).toContain("browse_opportunities");

      // Strictly does not have Beneficiary-only registration permissions
      expect(perms).not.toContain("register_opportunity");
      expect(perms).not.toContain("view_own_registrations");
      expect(perms).not.toContain("manage_companies");

      expect(perms.length).toBe(14);
    });

    it("Organization preserves all 13 baseline permissions plus browse_opportunities", () => {
      const perms = BASELINE_ROLE_PERMISSIONS.Organization;
      expect(perms).toBeDefined();

      // Preserved baseline permissions
      expect(perms).toContain("update_profile");
      expect(perms).toContain("view_organizations");
      expect(perms).toContain("update_organization");
      expect(perms).toContain("delete_organization");
      expect(perms).toContain("view_activities");
      expect(perms).toContain("create_activity");
      expect(perms).toContain("update_activity");
      expect(perms).toContain("delete_activity");
      expect(perms).toContain("view_published_activities");
      expect(perms).toContain("view_applications");
      expect(perms).toContain("accept_application");
      expect(perms).toContain("reject_application");
      expect(perms).toContain("confirm_completion");

      // Approved Company addition
      expect(perms).toContain("browse_opportunities");

      // Strictly does not have unapproved permissions
      expect(perms).not.toContain("search_talent");
      expect(perms).not.toContain("create_opportunity");
      expect(perms).not.toContain("register_opportunity");
      expect(perms).not.toContain("manage_companies");

      expect(perms.length).toBe(14);
    });

    it("manage_companies is strictly absent from all non-admin roles", () => {
      expect(BASELINE_ROLE_PERMISSIONS.Beneficiary).not.toContain("manage_companies");
      expect(BASELINE_ROLE_PERMISSIONS.Reviewer).not.toContain("manage_companies");
      expect(BASELINE_ROLE_PERMISSIONS.Company).not.toContain("manage_companies");
      expect(BASELINE_ROLE_PERMISSIONS.Organization).not.toContain("manage_companies");
    });
  });

  describe("Mocked Seed Function Execution & Idempotency", () => {
    function createMockPrisma() {
      let nextPermissionId = 1;
      let nextRoleId = 1;

      return {
        permissions: {
          upsert: vi.fn().mockImplementation(({ where, create }) => {
            return Promise.resolve({
              id: nextPermissionId++,
              name: create?.name ?? where.name,
            });
          }),
        },
        roles: {
          upsert: vi.fn().mockImplementation(({ where, create }) => {
            return Promise.resolve({
              id: nextRoleId++,
              name: create?.name ?? where.name,
              is_selectable: create?.is_selectable ?? false,
            });
          }),
        },
        role_permissions: {
          upsert: vi.fn().mockImplementation(({ create }) => {
            return Promise.resolve(create);
          }),
        },
      };
    }

    it("seedPermissions executes upsert for all 48 permissions with non-destructive update", async () => {
      const mockPrisma = createMockPrisma();

      const result = await seedPermissions(mockPrisma as unknown as PrismaClient);

      expect(mockPrisma.permissions.upsert).toHaveBeenCalledTimes(48);
      expect(result.size).toBe(48);

      // Verify each call uses update: {} to guarantee idempotency
      for (const call of mockPrisma.permissions.upsert.mock.calls) {
        expect(call[0].update).toEqual({});
        expect(call[0].where.name).toBe(call[0].create.name);
      }
    });

    it("seedRoles executes upsert for all 5 roles", async () => {
      const mockPrisma = createMockPrisma();

      const result = await seedRoles(mockPrisma as unknown as PrismaClient);

      expect(mockPrisma.roles.upsert).toHaveBeenCalledTimes(5);
      expect(result.size).toBe(5);
      expect(ROLE_NAMES).toEqual([
        "Reviewer",
        "Company",
        "Organization",
        "Beneficiary",
        "Admin",
      ]);
    });

    it("seedRolePermissions assigns all 48 permissions to Admin and expected counts to non-admin roles", async () => {
      const mockPrisma = createMockPrisma();

      const roles = new Map<string, Role>([
        ["Admin", { id: 1, name: "Admin" }],
        ["Beneficiary", { id: 2, name: "Beneficiary" }],
        ["Reviewer", { id: 3, name: "Reviewer" }],
        ["Company", { id: 4, name: "Company" }],
        ["Organization", { id: 5, name: "Organization" }],
      ]);

      const permissions = new Map<string, Permission>();
      PERMISSION_NAMES.forEach((name, idx) => {
        permissions.set(name, { id: idx + 1, name });
      });

      await seedRolePermissions(
        mockPrisma as unknown as PrismaClient,
        roles,
        permissions,
      );

      // Total assignments: Admin(48) + Beneficiary(13) + Reviewer(6) + Company(14) + Organization(14) = 95
      expect(mockPrisma.role_permissions.upsert).toHaveBeenCalledTimes(95);

      // Inspect Admin calls: role_id must be 1 for all 48 permissions
      const adminCalls = mockPrisma.role_permissions.upsert.mock.calls.filter(
        (call) => call[0].create.role_id === 1,
      );
      expect(adminCalls.length).toBe(48);

      // Every call uses update: {} ensuring idempotency on re-run
      for (const call of mockPrisma.role_permissions.upsert.mock.calls) {
        expect(call[0].update).toEqual({});
      }
    });

    it("repeated seed execution remains idempotent", async () => {
      const mockPrisma = createMockPrisma();

      const roles = new Map<string, Role>([
        ["Admin", { id: 1, name: "Admin" }],
        ["Beneficiary", { id: 2, name: "Beneficiary" }],
        ["Reviewer", { id: 3, name: "Reviewer" }],
        ["Company", { id: 4, name: "Company" }],
        ["Organization", { id: 5, name: "Organization" }],
      ]);

      const permissions = new Map<string, Permission>();
      PERMISSION_NAMES.forEach((name, idx) => {
        permissions.set(name, { id: idx + 1, name });
      });

      // First run
      await seedRolePermissions(mockPrisma as unknown as PrismaClient, roles, permissions);
      expect(mockPrisma.role_permissions.upsert).toHaveBeenCalledTimes(95);

      // Second run (simulating re-running seed on populated DB)
      await seedRolePermissions(mockPrisma as unknown as PrismaClient, roles, permissions);
      expect(mockPrisma.role_permissions.upsert).toHaveBeenCalledTimes(190);

      // All calls target the primary key (role_id_permission_id) with empty updates
      for (const call of mockPrisma.role_permissions.upsert.mock.calls) {
        expect(call[0].update).toEqual({});
        expect(call[0].where.role_id_permission_id).toBeDefined();
      }
    });
  });
});
