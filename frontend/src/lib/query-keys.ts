export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["users", "list", filters ?? {}] as const,
    detail: (id: number | string) => ["users", "detail", id] as const,
    profile: (id: number | string) => ["users", "profile", id] as const,
    analytics: () => ["users", "analytics"] as const,
    activity: ["users", "me", "activity"] as const,
    skills: (id: number | string) => ["users", id, "skills"] as const,
    reviewDomains: (id: number | string) =>
      ["users", id, "review-domains"] as const,
    socialPlatforms: ["users", "me", "social-platforms"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["projects", "list", filters ?? {}] as const,
    detail: (id: number | string) => ["projects", "detail", id] as const,
    adminDetail: (id: number | string) => ["projects", "admin", id] as const,
    byUser: (userId: number | string) => ["projects", "user", userId] as const,
  },
  skills: {
    all: ["skills"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["skills", "list", filters ?? {}] as const,
    categories: ["skills", "categories"] as const,
    mine: ["skills", "me"] as const,
  },
  domains: {
    all: ["domains"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["domains", "list", filters ?? {}] as const,
    detail: (id: number | string) => ["domains", "detail", id] as const,
    skills: (id: number | string) => ["domains", id, "skills"] as const,
    reviewers: (id: number | string) => ["domains", id, "reviewers"] as const,
    subDomains: (id: number | string) =>
      ["domains", id, "sub-domains"] as const,
    allSubDomains: (filters?: Record<string, unknown>) =>
      ["domains", "sub-domains", "all", filters ?? {}] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    mine: ["reviews", "me"] as const,
    byProject: (projectId: number | string) =>
      ["reviews", "project", projectId] as const,
    detail: (id: number | string) => ["reviews", "detail", id] as const,
    domains: ["reviews", "domains"] as const,
    queue: ["reviews", "queue"] as const,
    history: ["reviews", "history"] as const,
  },
  roles: {
    all: ["roles"] as const,
    detail: (id: number | string) => ["roles", "detail", id] as const,
    users: (id: number | string) => ["roles", id, "users"] as const,
  },
  documents: {
    all: ["documents"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["documents", "list", filters ?? {}] as const,
    detail: (id: number | string) => ["documents", "detail", id] as const,
  },
  demands: {
    all: ["demands"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["demands", "list", filters ?? {}] as const,
    detail: (id: number | string) => ["demands", "detail", id] as const,
  },
  cv: {
    all: ["cv"] as const,
    data: ["cv", "data"] as const,
    pdfStatus: ["cv", "pdf-status"] as const,
    workExperience: ["cv", "work-experience"] as const,
    education: ["cv", "education"] as const,
    certifications: ["cv", "certifications"] as const,
    languages: ["cv", "languages"] as const,
    availableLanguages: ["cv", "available-languages"] as const,
  },
  dashboard: {
    admin: ["dashboard", "admin"] as const,
    summary: ["dashboard", "summary"] as const,
    beneficiary: ["dashboard", "beneficiary"] as const,
    company: ["dashboard", "company"] as const,
    reviewer: ["dashboard", "reviewer"] as const,
  },
  volunteering: {
    all: ["volunteering"] as const,
    feed: (filters?: Record<string, unknown>) =>
      ["volunteering", "feed", filters ?? {}] as const,
    activity: (id: number | string) =>
      ["volunteering", "activity", id] as const,
    participants: (id: number | string) =>
      ["volunteering", "participants", id] as const,
    categories: ["volunteering", "categories"] as const,
    myApplications: ["volunteering", "my-applications"] as const,
    myActivities: ["volunteering", "my-activities"] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["organizations", "list", filters ?? {}] as const,
    detail: (id: number | string) =>
      ["organizations", "detail", id] as const,
    mine: ["organizations", "me"] as const,
  },
} as const;
