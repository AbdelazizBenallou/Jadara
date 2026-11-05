import { getPaginated } from "./http";
import { listRoles, getRoleUsers } from "./roles";
import type { Demand } from "@/types/demand";
import type { Project } from "@/types/project";

export interface AdminOverview {
  stats: {
    users: number | null;
    projects: number | null;
    pendingRequests: number | null;
    activeReviewers: number | null;
    domains: number | null;
    skills: number | null;
  };
  recentRequests: Demand[];
  recentProjects: Project[];
  activity: {
    date: string;
    requests: number;
    projects: number;
  }[];
  requestStatus: {
    pending: number;
    approved: number;
    rejected: number;
    other: number;
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    users,
    projects,
    pending,
    domains,
    skills,
    roles,
    demands,
    recentProjects,
  ] = await Promise.allSettled([
    getPaginated<unknown>("/users", { params: { limit: 1 } }),
    getPaginated<Project>("/projects/all", { params: { limit: 1 } }),
    getPaginated<Demand>("/demands", {
      params: { limit: 1, status: "pending" },
    }),
    getPaginated<unknown>("/domains", { params: { limit: 1 } }),
    getPaginated<unknown>("/skills", { params: { limit: 1 } }),
    listRoles(),
    getPaginated<Demand>("/demands", { params: { limit: 100 } }),
    getPaginated<Project>("/projects/all", { params: { limit: 100 } }),
  ]);

  let activeReviewers: number | null = null;
  if (roles.status === "fulfilled") {
    const reviewerRole = roles.value.find(
      (role) => role.name.toLowerCase() === "reviewer",
    );
    if (reviewerRole) {
      try {
        activeReviewers = (await getRoleUsers(reviewerRole.id)).length;
      } catch {
        activeReviewers = null;
      }
    }
  }

  const total = (result: PromiseSettledResult<{ meta?: { total: number } }>) =>
    result.status === "fulfilled" ? (result.value.meta?.total ?? null) : null;

  const demandItems = demands.status === "fulfilled" ? demands.value.items : [];
  const projectItems =
    recentProjects.status === "fulfilled" ? recentProjects.value.items : [];

  const dayKey = (value: string) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = dayKey(date.toISOString());
    return {
      date: key,
      requests: demandItems.filter(
        (demand) => dayKey(demand.created_at) === key,
      ).length,
      projects: projectItems.filter(
        (project) => dayKey(project.created_at) === key,
      ).length,
    };
  });

  const requestStatus = demandItems.reduce(
    (counts, demand) => {
      const status = demand.status?.toLowerCase();
      if (status === "pending") counts.pending += 1;
      else if (status === "approved") counts.approved += 1;
      else if (status === "rejected") counts.rejected += 1;
      else counts.other += 1;
      return counts;
    },
    { pending: 0, approved: 0, rejected: 0, other: 0 },
  );

  return {
    stats: {
      users: total(users),
      projects: total(projects),
      pendingRequests: total(pending),
      activeReviewers,
      domains: total(domains),
      skills: total(skills),
    },
    recentRequests: demandItems.slice(0, 5),
    recentProjects: projectItems.slice(0, 5),
    activity,
    requestStatus,
  };
}
