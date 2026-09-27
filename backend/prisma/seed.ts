import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Jadara database...");

  // Create permissions
  const permissionNames = [
    "manage_users",
    "manage_roles",
    "manage_permissions",
    "view_users",
    "update_profile",
    "view_domains",
    "create_domain",
    "update_domain",
    "delete_domain",
    "view_skills",
    "create_skill",
    "update_skill",
    "delete_skill",
    "create_project",
    "review_projects",
    "manage_projects",
    "create_document",
    "delete_document",
    "view_own_documents",
  ];

  const permissions = [];
  for (const name of permissionNames) {
    const perm = await prisma.permissions.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    permissions.push(perm);
  }
  console.log(`Created ${permissions.length} permissions`);

  // Create roles
  const selectableRoles = ["Beneficiary", "Reviewer", "Company"];
  const roleNames = [...selectableRoles, "Admin"];
  const roles = [];
  for (const name of roleNames) {
    const isSelectable = selectableRoles.includes(name);
    const role = await prisma.roles.upsert({
      where: { name },
      update: { is_selectable: isSelectable },
      create: { name, is_selectable: isSelectable },
    });
    roles.push(role);
  }
  console.log(`Created ${roles.length} roles`);

  // Create domains & skills (famous ones across CS + design fields)
  const domainsData = [
    { name: "Web Development", description: "Frontend and backend web technologies" },
    { name: "Mobile Development", description: "iOS and Android application development" },
    {
      name: "Data Science & AI",
      description: "Machine learning, data analysis and artificial intelligence",
    },
    { name: "Cybersecurity", description: "Security, penetration testing and cryptography" },
    { name: "Cloud & DevOps", description: "Cloud infrastructure, containers and deployment" },
    { name: "UI/UX Design", description: "User interface and user experience design" },
    { name: "Game Development", description: "Video game design and development" },
    { name: "Databases", description: "Relational and NoSQL databases" },
  ];

  const domainIds = new Map<string, number>();
  for (const d of domainsData) {
    const domain = await prisma.domains.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    domainIds.set(d.name, domain.id);
  }
  console.log(`Created ${domainsData.length} domains`);

  const skillsData: Array<{ name: string; domains: string[] }> = [
    { name: "JavaScript", domains: ["Web Development"] },
    { name: "TypeScript", domains: ["Web Development"] },
    { name: "HTML/CSS", domains: ["Web Development", "UI/UX Design"] },
    { name: "React", domains: ["Web Development", "UI/UX Design"] },
    { name: "Next.js", domains: ["Web Development"] },
    { name: "Node.js", domains: ["Web Development"] },
    { name: "Express.js", domains: ["Web Development"] },
    { name: "Tailwind CSS", domains: ["Web Development", "UI/UX Design"] },
    { name: "Flutter", domains: ["Mobile Development"] },
    { name: "React Native", domains: ["Mobile Development", "Web Development"] },
    { name: "Kotlin", domains: ["Mobile Development"] },
    { name: "Swift", domains: ["Mobile Development"] },
    { name: "Python", domains: ["Data Science & AI", "Cybersecurity"] },
    { name: "TensorFlow", domains: ["Data Science & AI"] },
    { name: "PyTorch", domains: ["Data Science & AI"] },
    { name: "Machine Learning", domains: ["Data Science & AI"] },
    { name: "Penetration Testing", domains: ["Cybersecurity"] },
    { name: "Network Security", domains: ["Cybersecurity"] },
    { name: "Cryptography", domains: ["Cybersecurity"] },
    { name: "Docker", domains: ["Cloud & DevOps"] },
    { name: "Kubernetes", domains: ["Cloud & DevOps"] },
    { name: "AWS", domains: ["Cloud & DevOps"] },
    { name: "CI/CD", domains: ["Cloud & DevOps"] },
    { name: "Linux", domains: ["Cloud & DevOps", "Cybersecurity"] },
    { name: "Git", domains: ["Cloud & DevOps", "Web Development", "Mobile Development"] },
    { name: "Figma", domains: ["UI/UX Design"] },
    { name: "Adobe XD", domains: ["UI/UX Design"] },
    { name: "Unity", domains: ["Game Development"] },
    { name: "Unreal Engine", domains: ["Game Development"] },
    { name: "C#", domains: ["Game Development"] },
    { name: "C++", domains: ["Game Development"] },
    { name: "SQL", domains: ["Databases"] },
    { name: "PostgreSQL", domains: ["Databases", "Web Development"] },
    { name: "MongoDB", domains: ["Databases"] },
    { name: "Redis", domains: ["Databases", "Cloud & DevOps"] },
  ];

  let skillDomainLinks = 0;
  for (const s of skillsData) {
    const skill = await prisma.skills.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name },
    });
    for (const domainName of s.domains) {
      const domainId = domainIds.get(domainName);
      if (!domainId) continue;
      await prisma.skill_domains.upsert({
        where: {
          skill_id_domain_id: { skill_id: skill.id, domain_id: domainId },
        },
        update: {},
        create: { skill_id: skill.id, domain_id: domainId },
      });
      skillDomainLinks++;
    }
  }
  console.log(`Created ${skillsData.length} skills with ${skillDomainLinks} domain links`);

  // Create languages
  const languagesData = [
    { name: "Arabic", code: "ar" },
    { name: "English", code: "en" },
    { name: "French", code: "fr" },
    { name: "Spanish", code: "es" },
    { name: "German", code: "de" },
    { name: "Italian", code: "it" },
    { name: "Portuguese", code: "pt" },
    { name: "Turkish", code: "tr" },
    { name: "Russian", code: "ru" },
    { name: "Chinese", code: "zh" },
    { name: "Japanese", code: "ja" },
    { name: "Korean", code: "ko" },
    { name: "Hindi", code: "hi" },
    { name: "Urdu", code: "ur" },
    { name: "Persian", code: "fa" },
    { name: "Dutch", code: "nl" },
    { name: "Swedish", code: "sv" },
    { name: "Norwegian", code: "no" },
    { name: "Danish", code: "da" },
    { name: "Finnish", code: "fi" },
    { name: "Greek", code: "el" },
    { name: "Hebrew", code: "he" },
    { name: "Thai", code: "th" },
    { name: "Vietnamese", code: "vi" },
    { name: "Indonesian", code: "id" },
    { name: "Malay", code: "ms" },
    { name: "Swahili", code: "sw" },
    { name: "Polish", code: "pl" },
    { name: "Czech", code: "cs" },
    { name: "Romanian", code: "ro" },
  ];

  for (const lang of languagesData) {
    await prisma.languages.upsert({
      where: { name: lang.name },
      update: {},
      create: lang,
    });
  }
  console.log(`Created ${languagesData.length} languages`);

  // Assign all permissions to Admin
  const adminRole = roles.find((r) => r.name === "Admin")!;
  for (const perm of permissions) {
    await prisma.role_permissions.upsert({
      where: { role_id_permission_id: { role_id: adminRole.id, permission_id: perm.id } },
      update: {},
      create: { role_id: adminRole.id, permission_id: perm.id },
    });
  }
  console.log("Assigned all permissions to Admin");

  // Assign baseline permissions to other roles
  const rolePermissionsMap: Record<string, string[]> = {
    Beneficiary: [
      "update_profile",
      "view_domains",
      "view_skills",
      "create_project",
      "create_document",
      "delete_document",
      "view_own_documents",
    ],
    Reviewer: ["update_profile", "view_domains", "view_skills", "review_projects"],
    Company: ["update_profile", "view_domains", "view_skills"],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionsMap)) {
    const role = roles.find((r) => r.name === roleName)!;
    for (const permName of permNames) {
      const perm = permissions.find((p) => p.name === permName)!;
      await prisma.role_permissions.upsert({
        where: { role_id_permission_id: { role_id: role.id, permission_id: perm.id } },
        update: {},
        create: { role_id: role.id, permission_id: perm.id },
      });
    }
  }
  console.log("Assigned baseline permissions to Beneficiary, Reviewer, Company");

  // Create default admin user
  const adminEmail = "admin@jadara.com";
  const existingAdmin = await prisma.users.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash("Admin@12345");
    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        status: "active",
        role_id: adminRole.id,
        profiles: {
          create: {
            first_name: "Admin",
            last_name: "User",
          },
        },
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log("Admin user already exists, skipping");
  }


  // Create default reviewer user
  const reviewerEmail = "reviewer@jadara.com";
  const existingReviewer = await prisma.users.findUnique({
    where: { email: reviewerEmail },
  });

  if (!existingReviewer) {
    const passwordHash = await argon2.hash("Reviewer@12345");

    const reviewer = await prisma.users.create({
      data: {
        email: reviewerEmail,
        password: passwordHash,
        status: "active",
        role_id: roles.find((r) => r.name === "Reviewer")!.id,
        profiles: {
          create: {
            first_name: "Reviewer",
            last_name: "User",
          },
        },
      },
    });

    console.log(`Created reviewer user: ${reviewerEmail}`);
  } else {
    console.log("Reviewer user already exists, skipping");
  }

  console.log("Seed completed!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
