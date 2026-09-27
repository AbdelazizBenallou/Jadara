import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FolderKanban,
  ShieldCheck,
  Loader2,
  ClipboardCheck,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";

export function AdminDashboard() {
  const { t, i18n } = useTranslation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        apiClient.get("/users?limit=1"),
        apiClient.get("/projects/all?limit=1"),
        apiClient.get("/demands?limit=1&status=pending"),
        apiClient.get("/domains?limit=1"),
        apiClient.get("/skills?limit=1"),
        apiClient.get("/roles"),
        apiClient.get("/demands?limit=5"),
        apiClient.get("/projects/all?limit=5"),
      ]);

      const [
        usersRes,
        projectsRes,
        demandsPendingRes,
        domainsRes,
        skillsRes,
        rolesRes,
        recentDemandsRes,
        recentProjectsRes,
      ] = results;

      let activeReviewers: number | null = null;
      if (rolesRes.status === "fulfilled") {
        const roles = rolesRes.value.data.data || [];
        const reviewerRole = roles.find(
          (r: { name: string }) => r.name === "Reviewer" || r.name === "reviewer",
        );
        if (reviewerRole) {
          try {
            const revRes = await apiClient.get(`/roles/${reviewerRole.id}/users`);
            const revUsers = revRes.data.data || [];
            activeReviewers = revUsers.length;
          } catch (e) {
            console.error("Failed to fetch active reviewers", e);
          }
        }
      }

      return {
        stats: {
          users: usersRes.status === "fulfilled" ? (usersRes.value.data.meta?.total ?? 0) : null,
          projects:
            projectsRes.status === "fulfilled" ? (projectsRes.value.data.meta?.total ?? 0) : null,
          pendingRequests:
            demandsPendingRes.status === "fulfilled"
              ? (demandsPendingRes.value.data.meta?.total ?? 0)
              : null,
          activeReviewers,
          domains:
            domainsRes.status === "fulfilled" ? (domainsRes.value.data.meta?.total ?? 0) : null,
          skills: skillsRes.status === "fulfilled" ? (skillsRes.value.data.meta?.total ?? 0) : null,
        },
        recentRequests:
          recentDemandsRes.status === "fulfilled"
            ? recentDemandsRes.value.data.data?.data || recentDemandsRes.value.data.data || []
            : [],
        recentProjects:
          recentProjectsRes.status === "fulfilled"
            ? recentProjectsRes.value.data.data?.data || recentProjectsRes.value.data.data || []
            : [],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const stats = dashboardData?.stats || {
    users: null,
    projects: null,
    pendingRequests: null,
    activeReviewers: null,
    domains: null,
    skills: null,
  };
  const recentRequests = dashboardData?.recentRequests || [];
  const recentProjects = dashboardData?.recentProjects || [];

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.dashboardTitle", { defaultValue: "Admin Dashboard" })}
      subtitle={t("admin.dashboardSubtitle", {
        defaultValue: "Platform overview and management",
      })}
    >
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("admin.welcome", { defaultValue: "Welcome to Admin Center" })}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("admin.welcomeDesc", {
                defaultValue: "Manage users, verify roles, and monitor platform activity.",
              })}
            </p>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              {t("admin.overview", { defaultValue: "Overview" })}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border bg-card">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label={t("admin.totalUsers", { defaultValue: "Total Users" })}
                value={stats.users !== null ? stats.users : "—"}
              />
              <StatCard
                icon={<FolderKanban className="h-5 w-5" />}
                label={t("admin.totalProjects", { defaultValue: "Total Projects" })}
                value={stats.projects !== null ? stats.projects : "—"}
              />
              <StatCard
                icon={<ClipboardCheck className="h-5 w-5" />}
                label={t("admin.pendingRequests", { defaultValue: "Pending Requests" })}
                value={stats.pendingRequests !== null ? stats.pendingRequests : "—"}
              />
              <StatCard
                icon={<ShieldCheck className="h-5 w-5" />}
                label={t("admin.activeReviewers", { defaultValue: "Active Reviewers" })}
                value={stats.activeReviewers !== null ? stats.activeReviewers : "—"}
              />
              <StatCard
                icon={<LayoutGrid className="h-5 w-5" />}
                label={t("admin.totalDomains", { defaultValue: "Total Domains" })}
                value={stats.domains !== null ? stats.domains : "—"}
              />
              <StatCard
                icon={<BookOpen className="h-5 w-5" />}
                label={t("admin.totalSkills", { defaultValue: "Total Skills" })}
                value={stats.skills !== null ? stats.skills : "—"}
              />
            </div>
          )}
        </section>

        {!isLoading && recentRequests.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {t("admin.recentRequests", { defaultValue: "Recent Registration Requests" })}
              </h2>
              <Button variant="ghost" asChild size="sm">
                <Link to="/admin/requests">
                  {t("common.viewAll", { defaultValue: "View All" })}
                </Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">
                        {t("admin.applicant", { defaultValue: "Applicant" })}
                      </th>
                      <th className="px-6 py-4 font-medium">
                        {t("admin.requestedRole", { defaultValue: "Requested Role" })}
                      </th>
                      <th className="px-6 py-4 font-medium">
                        {t("common.date", { defaultValue: "Date" })}
                      </th>
                      <th className="px-6 py-4 font-medium">
                        {t("common.status", { defaultValue: "Status" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRequests.map(
                      (req: {
                        id: number;
                        applicant?: {
                          email?: string;
                          profiles?: { first_name?: string; last_name?: string };
                        };
                        requested_role?: string;
                        role?: { name: string };
                        created_at: string;
                        status: string;
                      }) => (
                        <tr key={req.id} className="transition-colors hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {req.applicant?.profiles?.first_name ||
                                req.applicant?.profiles?.last_name
                                  ? `${req.applicant.profiles.first_name || ""} ${req.applicant.profiles.last_name || ""}`
                                  : req.applicant?.email || "Unnamed User"}
                              </span>
                              {req.applicant?.email && (
                                <span className="text-xs text-muted-foreground">
                                  {req.applicant.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 capitalize">
                            {req.requested_role || req.role?.name}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(req.created_at, i18n.language)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={req.status} />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {!isLoading && recentProjects.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {t("admin.recentProjects", { defaultValue: "Recent Projects" })}
              </h2>
              <Button variant="ghost" asChild size="sm">
                <Link to="/admin/projects">
                  {t("common.viewAll", { defaultValue: "View All" })}
                </Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">
                        {t("common.title", { defaultValue: "Title" })}
                      </th>
                      <th className="px-6 py-4 font-medium">
                        {t("common.beneficiary", { defaultValue: "Beneficiary" })}
                      </th>
                      <th className="px-6 py-4 font-medium">
                        {t("common.date", { defaultValue: "Date" })}
                      </th>
                      <th className="px-6 py-4 font-medium">
                        {t("common.status", { defaultValue: "Status" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentProjects.map(
                      (project: {
                        id: number;
                        title: string;
                        user?: { first_name?: string; last_name?: string; email?: string };
                        created_at: string;
                        status: string;
                      }) => (
                        <tr key={project.id} className="transition-colors hover:bg-muted/50">
                          <td className="px-6 py-4 font-medium text-foreground">{project.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-foreground">
                                {project.user?.first_name || project.user?.last_name
                                  ? `${project.user.first_name || ""} ${project.user.last_name || ""}`
                                  : project.user?.email || "Unnamed User"}
                              </span>
                              {project.user?.email && (
                                <span className="text-xs text-muted-foreground">
                                  {project.user.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(project.created_at, i18n.language)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={project.status} />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              {t("admin.quickActions", { defaultValue: "Quick Actions" })}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/users"
              className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border text-primary dark:bg-slate-800 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {t("admin.manageUsers", { defaultValue: "Manage Users" })}
              </h3>
            </Link>

            <Link
              to="/admin/requests"
              className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border text-orange-600 dark:bg-slate-800 dark:text-orange-400">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {t("admin.quickActions.manageRequests", { defaultValue: "Manage Requests" })}
              </h3>
            </Link>

            <Link
              to="/admin/projects"
              className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border text-emerald-600 dark:bg-slate-800 dark:text-emerald-400">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {t("admin.manageProjects", { defaultValue: "Manage Projects" })}
              </h3>
            </Link>

            <Link
              to="/admin/roles"
              className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border text-purple-600 dark:bg-slate-800 dark:text-purple-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {t("admin.manageRoles", { defaultValue: "System Roles" })}
              </h3>
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
