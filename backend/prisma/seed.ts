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

  // Create sub-domains linked to parent domains
  const subDomainsData: Array<{ domain: string; name: string; description?: string }> = [
    { domain: "Web Development", name: "Frontend Development", description: "Client-side web development using modern JS/CSS frameworks" },
    { domain: "Web Development", name: "Backend Development", description: "Server-side web development, APIs, and microservices" },
    { domain: "Web Development", name: "Full Stack Development", description: "End-to-end full stack web architecture" },
    { domain: "Mobile Development", name: "iOS Development", description: "Native iOS app development with Swift" },
    { domain: "Mobile Development", name: "Android Development", description: "Native Android app development with Kotlin" },
    { domain: "Mobile Development", name: "Cross-Platform Mobile", description: "Multi-platform mobile apps with Flutter and React Native" },
    { domain: "Data Science & AI", name: "Machine Learning", description: "Statistical modeling and applied machine learning" },
    { domain: "Data Science & AI", name: "Deep Learning & NLP", description: "Neural networks, computer vision, and language models" },
    { domain: "Data Science & AI", name: "Data Engineering", description: "Big data pipelines, ETL, and data warehousing" },
    { domain: "Cybersecurity", name: "Penetration Testing", description: "Ethical hacking and vulnerability assessments" },
    { domain: "Cybersecurity", name: "Application Security", description: "Secure coding practices and AppSec" },
    { domain: "Cybersecurity", name: "Cloud Security", description: "Security configurations for cloud environments" },
    { domain: "Cloud & DevOps", name: "Cloud Architecture", description: "Designing scalable multi-cloud infrastructure" },
    { domain: "Cloud & DevOps", name: "CI/CD & DevOps Automation", description: "Deployment pipelines and automated infrastructure" },
    { domain: "Cloud & DevOps", name: "Site Reliability Engineering", description: "High availability, monitoring, and observability" },
    { domain: "UI/UX Design", name: "User Interface (UI)", description: "Visual design, prototyping, and components" },
    { domain: "UI/UX Design", name: "User Experience (UX)", description: "User research, wireframing, and usability testing" },
    { domain: "UI/UX Design", name: "Design Systems", description: "Design tokens, style guides, and component libraries" },
    { domain: "Game Development", name: "Game Engine Programming", description: "Unity and Unreal engine development" },
    { domain: "Game Development", name: "3D Graphics & Shaders", description: "Real-time rendering and shader development" },
    { domain: "Databases", name: "Relational Databases", description: "PostgreSQL, MySQL design and optimization" },
    { domain: "Databases", name: "NoSQL & Distributed Systems", description: "Document stores, key-value stores, and distributed caching" },
  ];

  let subDomainCount = 0;
  for (const sd of subDomainsData) {
    const parentDomainId = domainIds.get(sd.domain);
    if (!parentDomainId) continue;
    await prisma.sub_domains.upsert({
      where: {
        domain_id_name: { domain_id: parentDomainId, name: sd.name },
      },
      update: { description: sd.description },
      create: {
        domain_id: parentDomainId,
        name: sd.name,
        description: sd.description,
      },
    });
    subDomainCount++;
  }
  console.log(`Created ${subDomainCount} sub-domains`);

  // Create skill categories
  const skillCategoriesData = [
    {
      name: "Programming Languages",
      description: "Core programming and scripting languages",
    },
    {
      name: "Frameworks & Libraries",
      description: "Frontend, backend, and mobile application frameworks and libraries",
    },
    {
      name: "Data Science & AI",
      description: "Machine learning, deep learning, and AI frameworks",
    },
    {
      name: "Cloud & DevOps",
      description: "Cloud platforms, infrastructure as code, containerization, and CI/CD tools",
    },
    {
      name: "Cybersecurity",
      description: "Security assessment, penetration testing, and cryptography tools",
    },
    {
      name: "UI/UX Design",
      description: "User experience and interface design tools",
    },
    {
      name: "Game Development",
      description: "Game engines and real-time graphics development tools",
    },
    {
      name: "Databases",
      description: "Relational, NoSQL, and memory-cache data management systems",
    },
  ];

  const categoryIds = new Map<string, number>();
  for (const c of skillCategoriesData) {
    const category = await prisma.skill_categories.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: c,
    });
    categoryIds.set(c.name, category.id);
  }
  console.log(`Created ${skillCategoriesData.length} skill categories`);

  const skillsData: Array<{ name: string; category: string; domains: string[] }> = [
    { name: "JavaScript", category: "Programming Languages", domains: ["Web Development"] },
    { name: "TypeScript", category: "Programming Languages", domains: ["Web Development"] },
    { name: "HTML/CSS", category: "Frameworks & Libraries", domains: ["Web Development", "UI/UX Design"] },
    { name: "React", category: "Frameworks & Libraries", domains: ["Web Development", "UI/UX Design"] },
    { name: "Next.js", category: "Frameworks & Libraries", domains: ["Web Development"] },
    { name: "Node.js", category: "Frameworks & Libraries", domains: ["Web Development"] },
    { name: "Express.js", category: "Frameworks & Libraries", domains: ["Web Development"] },
    { name: "Tailwind CSS", category: "Frameworks & Libraries", domains: ["Web Development", "UI/UX Design"] },
    { name: "Flutter", category: "Frameworks & Libraries", domains: ["Mobile Development"] },
    { name: "React Native", category: "Frameworks & Libraries", domains: ["Mobile Development", "Web Development"] },
    { name: "Kotlin", category: "Programming Languages", domains: ["Mobile Development"] },
    { name: "Swift", category: "Programming Languages", domains: ["Mobile Development"] },
    { name: "Python", category: "Programming Languages", domains: ["Data Science & AI", "Cybersecurity"] },
    { name: "TensorFlow", category: "Data Science & AI", domains: ["Data Science & AI"] },
    { name: "PyTorch", category: "Data Science & AI", domains: ["Data Science & AI"] },
    { name: "Machine Learning", category: "Data Science & AI", domains: ["Data Science & AI"] },
    { name: "Penetration Testing", category: "Cybersecurity", domains: ["Cybersecurity"] },
    { name: "Network Security", category: "Cybersecurity", domains: ["Cybersecurity"] },
    { name: "Cryptography", category: "Cybersecurity", domains: ["Cybersecurity"] },
    { name: "Docker", category: "Cloud & DevOps", domains: ["Cloud & DevOps"] },
    { name: "Kubernetes", category: "Cloud & DevOps", domains: ["Cloud & DevOps"] },
    { name: "AWS", category: "Cloud & DevOps", domains: ["Cloud & DevOps"] },
    { name: "CI/CD", category: "Cloud & DevOps", domains: ["Cloud & DevOps"] },
    { name: "Linux", category: "Cloud & DevOps", domains: ["Cloud & DevOps", "Cybersecurity"] },
    { name: "Git", category: "Cloud & DevOps", domains: ["Cloud & DevOps", "Web Development", "Mobile Development"] },
    { name: "Figma", category: "UI/UX Design", domains: ["UI/UX Design"] },
    { name: "Adobe XD", category: "UI/UX Design", domains: ["UI/UX Design"] },
    { name: "Unity", category: "Game Development", domains: ["Game Development"] },
    { name: "Unreal Engine", category: "Game Development", domains: ["Game Development"] },
    { name: "C#", category: "Programming Languages", domains: ["Game Development"] },
    { name: "C++", category: "Programming Languages", domains: ["Game Development"] },
    { name: "SQL", category: "Programming Languages", domains: ["Databases"] },
    { name: "PostgreSQL", category: "Databases", domains: ["Databases", "Web Development"] },
    { name: "MongoDB", category: "Databases", domains: ["Databases"] },
    { name: "Redis", category: "Databases", domains: ["Databases", "Cloud & DevOps"] },
  ];

  let skillDomainLinks = 0;
  for (const s of skillsData) {
    const categoryId = categoryIds.get(s.category);
    if (!categoryId) {
      throw new Error(`Category "${s.category}" not found for skill "${s.name}"`);
    }

    const skill = await prisma.skills.upsert({
      where: { name: s.name },
      update: { category_id: categoryId },
      create: { name: s.name, category_id: categoryId },
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
  let reviewer = await prisma.users.findUnique({
    where: { email: reviewerEmail },
  });

  if (!reviewer) {
    const passwordHash = await argon2.hash("Reviewer@12345");

    reviewer = await prisma.users.create({
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
    console.log("Reviewer user already exists, skipping creation");
  }

  // Ensure reviewer is linked to strictly ONE domain
  const webDevDomainId = domainIds.get("Web Development");
  if (webDevDomainId && reviewer) {
    await prisma.reviewer_domains.upsert({
      where: { user_id: reviewer.id },
      update: { domain_id: webDevDomainId },
      create: { user_id: reviewer.id, domain_id: webDevDomainId },
    });
    console.log(`Assigned reviewer ${reviewerEmail} to single domain: Web Development (ID: ${webDevDomainId})`);
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
