import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

type Permission = { id: number; name: string };
type Role = { id: number; name: string };

const PERMISSION_NAMES = [
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

  // Volunteer Applications
  "view_applications",
  "accept_application",
  "reject_application",

  // Volunteering Completion
  "confirm_completion",
];

const BASELINE_ROLE_PERMISSIONS: Record<string, string[]> = {
  Beneficiary: [
    "update_profile",
    "view_domains",
    "view_skills",
    "create_project",
    "create_document",
    "delete_document",
    "view_own_documents",
  ],

  Reviewer: [
    "update_profile",
    "view_domains",
    "view_skills",
    "review_projects",
  ],

  Company: [
    "update_profile",
    "view_domains",
    "view_skills",
  ],

  Organization: [
    // Personal profile
    "update_profile",

    // Organization
    "view_organizations",
    "update_organization",
    "delete_organization",

    // Volunteering activities
    "view_activities",
    "create_activity",
    "update_activity",
    "delete_activity",

    // Volunteer applications
    "view_applications",
    "accept_application",
    "reject_application",

    // Completion
    "confirm_completion",
  ],
};

const SELECTABLE_ROLE_NAMES = [
  "Beneficiary",
  "Reviewer",
  "Company",
  "Organization",
];

const ROLE_NAMES = [...SELECTABLE_ROLE_NAMES, "Admin"];

const DEFAULT_USERS = [
  {
    email: "admin@jadara.com",
    password: "Admin@12345",
    role: "Admin",
    firstName: "Admin",
    lastName: "User",
  },
  {
    email: "reviewer@jadara.com",
    password: "Reviewer@12345",
    role: "Reviewer",
    firstName: "Reviewer",
    lastName: "User",
  },
  {
    email: "company@jadara.com",
    password: "Company@12345",
    role: "Company",
    firstName: "Company",
    lastName: "User",
  },
  {
    email: "beneficiary@jadara.com",
    password: "Beneficiary@12345",
    role: "Beneficiary",
    firstName: "Beneficiary",
    lastName: "User",
  },
  {
    email: "organization@jadara.com",
    password: "Organization@12345",
    role: "Organization",
    firstName: "Organization",
    lastName: "User",
  },
];

function must<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Seed failed: could not resolve "${label}"`);
  }

  return value;
}

async function seedPermissions(
  prisma: PrismaClient,
): Promise<Map<string, Permission>> {
  const permissions = new Map<string, Permission>();

  for (const name of PERMISSION_NAMES) {
    const permission = await prisma.permissions.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    permissions.set(permission.name, permission);
  }

  console.log(`Permissions seeded: ${permissions.size}`);

  return permissions;
}

async function seedRoles(
  prisma: PrismaClient,
): Promise<Map<string, Role>> {
  const roles = new Map<string, Role>();

  for (const name of ROLE_NAMES) {
    const isSelectable = SELECTABLE_ROLE_NAMES.includes(name);

    const role = await prisma.roles.upsert({
      where: { name },
      update: {
        is_selectable: isSelectable,
      },
      create: {
        name,
        is_selectable: isSelectable,
      },
    });

    roles.set(role.name, role);
  }

  console.log(`Roles seeded: ${roles.size}`);

  return roles;
}

async function seedRolePermissions(
  prisma: PrismaClient,
  roles: Map<string, Role>,
  permissions: Map<string, Permission>,
): Promise<void> {
  // --------------------------------------------------
  // ADMIN
  // Admin receives ALL permissions
  // --------------------------------------------------

  const adminRole = must(roles.get("Admin"), "role Admin");

  let assigned = 0;

  for (const permission of permissions.values()) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    });

    assigned += 1;
  }

  console.log(`Admin permissions assigned: ${assigned}`);

  // --------------------------------------------------
  // BASELINE ROLE PERMISSIONS
  // --------------------------------------------------

  for (const [roleName, permissionNames] of Object.entries(
    BASELINE_ROLE_PERMISSIONS,
  )) {
    const role = must(roles.get(roleName), `role ${roleName}`);

    for (const permissionName of permissionNames) {
      const permission = must(
        permissions.get(permissionName),
        `permission ${permissionName} for role ${roleName}`,
      );

      await prisma.role_permissions.upsert({
        where: {
          role_id_permission_id: {
            role_id: role.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: role.id,
          permission_id: permission.id,
        },
      });
    }

    console.log(`Baseline permissions assigned to ${roleName}`);
  }
}

async function seedUsers(
  prisma: PrismaClient,
  roles: Map<string, Role>,
): Promise<void> {
  for (const user of DEFAULT_USERS) {
    const existing = await prisma.users.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`User already exists, skipped: ${user.email}`);
      continue;
    }

    const role = must(
      roles.get(user.role),
      `role ${user.role}`,
    );

    const passwordHash = await argon2.hash(user.password);

    await prisma.users.create({
      data: {
        email: user.email,
        password: passwordHash,
        status: "active",
        role_id: role.id,

        profiles: {
          create: {
            first_name: user.firstName,
            last_name: user.lastName,
          },
        },
      },
    });

    console.log(
      `User created: ${user.email} (password: ${user.password})`,
    );
  }
}

export async function seedRolesAndUsers(
  prisma: PrismaClient,
): Promise<void> {
  const [permissions, roles] = await Promise.all([
    seedPermissions(prisma),
    seedRoles(prisma),
  ]);

  await seedRolePermissions(
    prisma,
    roles,
    permissions,
  );

  await seedUsers(
    prisma,
    roles,
  );
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    await seedRolesAndUsers(prisma);

    console.log("Users seed completed!");
  } finally {
    await prisma.$disconnect();
  }
}

// Only run when this file is executed directly (`npm run db:seed:users`),
// not when it is imported by seed.ts.
const entry = process.argv[1];

if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}