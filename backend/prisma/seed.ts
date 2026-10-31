import { PrismaClient } from "@prisma/client";
import { seedRolesAndUsers } from "./seed_users.js";

const prisma = new PrismaClient();

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

const DEFAULT_SKILL_CATEGORY = "Technical Skills";

const ACTIVITY_CATEGORIES_DATA = [
  {
    name: "Environment",
    description: "Conservation, cleanup, climate and wildlife",
  },
  {
    name: "Education",
    description: "Tutoring, literacy and mentoring",
  },
  {
    name: "Health",
    description: "Public health, first aid and wellbeing",
  },
  {
    name: "Social Services",
    description: "Community support and care",
  },
  {
    name: "Humanitarian Relief",
    description: "Emergency and disaster response",
  },
  {
    name: "Community Development",
    description: "Local infrastructure and empowerment",
  },
  {
    name: "Culture & Arts",
    description: "Heritage, events and creative workshops",
  },
  {
    name: "Sports & Recreation",
    description: "Coaching, events and youth sport",
  },
];

const SKILLS_DATA: Array<{
  name: string;
  domains: string[];
  category?: string;
}> = [
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
    {
      name: "Communication",
      domains: [],
      category: "Soft Skills",
    },
    {
      name: "Teamwork",
      domains: [],
      category: "Soft Skills",
    },
    {
      name: "Problem Solving",
      domains: [],
      category: "Soft Skills",
    },
  ];

const LANGUAGES_DATA = [
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

const SOCIAL_PLATFORMS = [
  "linkedin",
  "github",
  "gitlab",
  "facebook",
  "instagram",
  "x",
  "youtube",
  "tiktok",
  "telegram",
  "whatsapp",
  "discord",
  "behance",
  "dribbble",
  "stackoverflow",
  "medium",
  "portfolio",
];

// Legacy display names written by older seeds; renamed in place so existing
// user_socials.platform_id foreign keys stay valid.
const LEGACY_PLATFORM_NAMES: Record<string, string> = {
  LinkedIn: "linkedin",
  GitHub: "github",
  GitLab: "gitlab",
  Facebook: "facebook",
  Instagram: "instagram",
  X: "x",
  YouTube: "youtube",
  TikTok: "tiktok",
  Telegram: "telegram",
  WhatsApp: "whatsapp",
  Discord: "discord",
  Behance: "behance",
  Dribbble: "dribbble",
  "Stack Overflow": "stackoverflow",
  Medium: "medium",
};

function must<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Seed failed: could not resolve "${label}"`);
  }
  return value;
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

async function seedActivityCategories(): Promise<void> {
  for (const data of ACTIVITY_CATEGORIES_DATA) {
    await prisma.activity_categories.upsert({
      where: { name: data.name },
      update: { description: data.description },
      create: data,
    });
  }

  console.log(`Activity categories seeded: ${ACTIVITY_CATEGORIES_DATA.length}`);
}

async function seedSkills(
  domainIds: Map<string, number>,
  categoryIds: Map<string, number>,
): Promise<void> {
  const defaultCategoryId = must(
    categoryIds.get(DEFAULT_SKILL_CATEGORY),
    `skill category ${DEFAULT_SKILL_CATEGORY}`,
  );

  let links = 0;

  for (const data of SKILLS_DATA) {
    const categoryId = data.category
      ? must(categoryIds.get(data.category), `skill category ${data.category}`)
      : defaultCategoryId;

    const skill = await prisma.skills.upsert({
      where: { name: data.name },
      update: { category_id: categoryId },
      create: { name: data.name, category_id: categoryId },
    });

    for (const domainName of data.domains) {
      const domainId = domainIds.get(domainName);

      if (domainId === undefined) {
        throw new Error(
          `Seed failed: skill "${data.name}" references unknown domain "${domainName}"`,
        );
      }

      await prisma.skill_domains.upsert({
        where: { skill_id_domain_id: { skill_id: skill.id, domain_id: domainId } },
        update: {},
        create: { skill_id: skill.id, domain_id: domainId },
      });
      links += 1;
    }
  }

  console.log(`Skills seeded: ${SKILLS_DATA.length} (${links} domain links)`);
}

async function main(): Promise<void> {
  console.log("Seeding Jadara database...");

  await seedLanguages();
  await seedSocialPlatforms();

  const domainIds = await seedDomains();
  await seedSubDomains(domainIds);

  const categoryIds = await seedSkillCategories();
  await seedSkills(domainIds, categoryIds);

  await seedActivityCategories();

  await seedRolesAndUsers(prisma);

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
