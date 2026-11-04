import { getData } from "./http";

export interface DashboardSummary {
  counts: {
    totalUsers: number;
    totalDemandsPending: number;
    totalProjectsSubmitted: number;
    totalActivitiesPending: number;
    totalOrganizations: number;
    totalApplications: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  recentUsers: Array<{
    id: number;
    email: string;
    role: string;
    fullName: string | null;
    createdAt: string;
  }>;
  pendingRegistrationDemands: Array<{
    id: number;
    applicant: { name: string | null; email: string | null };
    requestedRole: string;
    createdAt: string;
  }>;
  pendingActivities: Array<{
    id: number;
    title: string;
    organization: string | null;
    createdAt: string;
  }>;
  pendingProjects: Array<{
    id: number;
    title: string;
    owner: string | null;
    status: string;
    createdAt: string;
  }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return getData<DashboardSummary>("/dashboard/summary");
}
