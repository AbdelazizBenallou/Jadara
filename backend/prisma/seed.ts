import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

type Permission = { id: number; name: string };
type Role = { id: number; name: string };

const PERMISSION_NAMES = [
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
  Reviewer: ["update_profile", "view_domains", "view_skills", "review_projects"],
  Company: ["update_profile", "view_domains", "view_skills"],
};

const SELECTABLE_ROLE_NAMES = ["Beneficiary", "Reviewer", "Company"];
const ROLE_NAMES = [...SELECTABLE_ROLE_NAMES, "Admin"];

const DOMAINS_DATA = [
  {
    name: "Web Development",
    description: "Design and development of websites and web applications",
  },
  {
    name: "Mobile Development",
    description: "Development of applications for mobile devices",
  },
  {
    name: "Data Science & AI",
    description: "Data analysis, machine learning and artificial intelligence",
  },
  {
    name: "Cybersecurity",
    description: "Protection of systems, networks, applications and data",
  },
  {
    name: "Cloud & DevOps",
    description: "Cloud infrastructure, automation and software delivery",
  },
  {
    name: "UI/UX Design",
    description: "User interface and user experience design",
  },
  {
    name: "Game Development",
    description: "Design and development of video games",
  },
  {
    name: "Databases",
    description: "Design, management and optimization of data storage systems",
  },
];

const SUB_DOMAINS_DATA: Array<{
  name: string;
  description: string;
  domain: string;
}> = [
    {
      name: "Frontend Development",
      description: "Development of web user interfaces and client-side applications",
      domain: "Web Development",
    },
    {
      name: "Backend Development",
      description: "Server-side application and API development",
      domain: "Web Development",
    },
    {
      name: "Full-Stack Development",
      description: "Development across frontend and backend technologies",
      domain: "Web Development",
    },
    {
      name: "Web Performance",
      description: "Optimization of web application speed, accessibility and performance",
      domain: "Web Development",
    },

    {
      name: "Android Development",
      description: "Development of applications for Android devices",
      domain: "Mobile Development",
    },
    {
      name: "iOS Development",
      description: "Development of applications for Apple devices",
      domain: "Mobile Development",
    },
    {
      name: "Cross-Platform Development",
      description: "Development of mobile applications using cross-platform technologies",
      domain: "Mobile Development",
    },

    {
      name: "Data Analysis",
      description: "Analysis, visualization and interpretation of data",
      domain: "Data Science & AI",
    },
    {
      name: "Machine Learning",
      description: "Development and application of machine learning models",
      domain: "Data Science & AI",
    },
    {
      name: "Deep Learning",
      description: "Neural networks and advanced machine learning techniques",
      domain: "Data Science & AI",
    },
    {
      name: "Natural Language Processing",
      description: "Processing and understanding human language using computational methods",
      domain: "Data Science & AI",
    },
    {
      name: "Computer Vision",
      description: "Analysis and understanding of images and video",
      domain: "Data Science & AI",
    },

    {
      name: "Network Security",
      description: "Protection of networks, infrastructure and network traffic",
      domain: "Cybersecurity",
    },
    {
      name: "Application Security",
      description: "Security of software applications and APIs",
      domain: "Cybersecurity",
    },
    {
      name: "Penetration Testing",
      description: "Security testing and identification of vulnerabilities",
      domain: "Cybersecurity",
    },
    {
      name: "Cryptography",
      description: "Encryption, authentication and secure communication",
      domain: "Cybersecurity",
    },

    {
      name: "Cloud Computing",
      description: "Cloud infrastructure, services and architecture",
      domain: "Cloud & DevOps",
    },
    {
      name: "DevOps",
      description: "Software development, operations and delivery automation",
      domain: "Cloud & DevOps",
    },
    {
      name: "Containerization",
      description: "Container-based application deployment and management",
      domain: "Cloud & DevOps",
    },
    {
      name: "CI/CD",
      description: "Continuous integration and continuous delivery",
      domain: "Cloud & DevOps",
    },

    {
      name: "User Interface Design",
      description: "Design of digital interfaces and visual systems",
      domain: "UI/UX Design",
    },
    {
      name: "User Experience Design",
      description: "Research and design focused on user experience",
      domain: "UI/UX Design",
    },
    {
      name: "Interaction Design",
      description: "Design of interactions between users and digital products",
      domain: "UI/UX Design",
    },
    {
      name: "Design Systems",
      description: "Reusable components, patterns and design standards",
      domain: "UI/UX Design",
    },

    {
      name: "Game Programming",
      description: "Programming gameplay systems and game mechanics",
      domain: "Game Development",
    },
    {
      name: "Game Design",
      description: "Design of gameplay, mechanics and player experiences",
      domain: "Game Development",
    },
    {
      name: "Game Art",
      description: "Visual assets, environments and character design for games",
      domain: "Game Development",
    },

    {
      name: "Relational Databases",
      description: "SQL-based relational database systems",
      domain: "Databases",
    },
    {
      name: "NoSQL Databases",
      description: "Non-relational database systems",
      domain: "Databases",
    },
    {
      name: "Database Administration",
      description: "Management, maintenance and optimization of databases",
      domain: "Databases",
    },
  ];

const SKILL_CATEGORIES_DATA = [
  {
    name: "Technical Skills",
    description:
      "Technical and professional skills related to a specific field, technology, tool, or discipline",
  },
  {
    name: "Soft Skills",
    description: "Interpersonal, communication, behavioral, and professional skills",
  },
];

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
    permissions.set(permission.name, permission);
  }

  console.log(`Permissions seeded: ${permissions.size}`);
  return permissions;
}

async function seedRoles(): Promise<Map<string, Role>> {
  const roles = new Map<string, Role>();

  for (const name of ROLE_NAMES) {
    const isSelectable = SELECTABLE_ROLE_NAMES.includes(name);
    const role = await prisma.roles.upsert({
      where: { name },
      update: { is_selectable: isSelectable },
      create: { name, is_selectable: isSelectable },
    });
    roles.set(role.name, role);
  }

  console.log(`Roles seeded: ${roles.size}`);
  return roles;
}

async function seedRolePermissions(
  roles: Map<string, Role>,
  permissions: Map<string, Permission>,
): Promise<void> {
  const adminRole = must(roles.get("Admin"), "role Admin");
  let assigned = 0;

  for (const permission of permissions.values()) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: { role_id: adminRole.id, permission_id: permission.id },
      },
      update: {},
      create: { role_id: adminRole.id, permission_id: permission.id },
    });
    assigned += 1;
  }
  console.log(`Admin permissions assigned: ${assigned}`);

  for (const [roleName, permissionNames] of Object.entries(BASELINE_ROLE_PERMISSIONS)) {
    const role = must(roles.get(roleName), `role ${roleName}`);

    for (const permissionName of permissionNames) {
      const permission = must(
        permissions.get(permissionName),
        `permission ${permissionName} for role ${roleName}`,
      );
      await prisma.role_permissions.upsert({
        where: {
          role_id_permission_id: { role_id: role.id, permission_id: permission.id },
        },
        update: {},
        create: { role_id: role.id, permission_id: permission.id },
      });
    }
    console.log(`Baseline permissions assigned to ${roleName}`);
  }
}

async function seedLanguages(): Promise<void> {
  for (const language of LANGUAGES_DATA) {
    await prisma.languages.upsert({
      where: { name: language.name },
      update: { code: language.code },
      create: language,
    });
  }
  console.log(`Languages seeded: ${LANGUAGES_DATA.length}`);
}

async function seedSocialPlatforms(): Promise<void> {
  for (const [legacy, slug] of Object.entries(LEGACY_PLATFORM_NAMES)) {
    if (legacy === slug) continue;
    await prisma.social_platforms.updateMany({
      where: { name: legacy },
      data: { name: slug },
    });
  }

  for (const name of SOCIAL_PLATFORMS) {
    await prisma.social_platforms.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Social platforms seeded: ${SOCIAL_PLATFORMS.length}`);
}

async function seedDomains(): Promise<Map<string, number>> {
  const domainIds = new Map<string, number>();

  for (const data of DOMAINS_DATA) {
    const domain = await prisma.domains.upsert({
      where: { name: data.name },
      update: { description: data.description },
      create: data,
    });
    domainIds.set(domain.name, domain.id);
  }

  console.log(`Domains seeded: ${domainIds.size}`);
  return domainIds;
}

async function seedSubDomains(domainIds: Map<string, number>): Promise<void> {
  let created = 0;

  for (const data of SUB_DOMAINS_DATA) {
    const domainId = domainIds.get(data.domain);

    if (domainId === undefined) {
      throw new Error(
        `Seed failed: sub-domain "${data.name}" references unknown domain "${data.domain}"`,
      );
    }

    await prisma.sub_domains.upsert({
      where: { domain_id_name: { domain_id: domainId, name: data.name } },
      update: { description: data.description },
      create: { name: data.name, description: data.description, domain_id: domainId },
    });
    created += 1;
  }

  console.log(`Sub-domains seeded: ${created}`);
}

async function seedSkillCategories(): Promise<Map<string, number>> {
  const categoryIds = new Map<string, number>();

  for (const data of SKILL_CATEGORIES_DATA) {
    const category = await prisma.skill_categories.upsert({
      where: { name: data.name },
      update: { description: data.description },
      create: data,
    });
    categoryIds.set(category.name, category.id);
  }

  console.log(`Skill categories seeded: ${categoryIds.size}`);
  return categoryIds;
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
        email: user.email,
        password: passwordHash,
        status: "active",
        role_id: role.id,
        profiles: {
          create: { first_name: user.firstName, last_name: user.lastName },
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
}

async function main(): Promise<void> {
  console.log("Seeding Jadara database...");

  const [permissions, roles] = await Promise.all([seedPermissions(), seedRoles()]);

  await seedLanguages();
  await seedSocialPlatforms();

  const domainIds = await seedDomains();
  await seedSubDomains(domainIds);

  const categoryIds = await seedSkillCategories();
  await seedSkills(domainIds, categoryIds);

  await seedRolePermissions(roles, permissions);
  await seedUsers(roles);

  console.log("Seed completed!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
