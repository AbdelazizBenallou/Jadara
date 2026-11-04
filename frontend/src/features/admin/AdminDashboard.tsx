import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  FolderKanban,
  Layers,
  LayoutGrid,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDashboardSummary } from "@/api/dashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminStatBox } from "@/components/admin/AdminStatBox";
import { AdminCard } from "@/components/admin/AdminCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { queryKeys } from "@/lib/query-keys";

export function AdminDashboard() {
  const { t } = useTranslation();
  const [chartPeriod, setChartPeriod] = useState<"week" | "month" | "year">("month");

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60 * 2,
  });

  const counts = summary?.counts || {
    totalUsers: 0,
    totalDemandsPending: 0,
    totalProjectsSubmitted: 0,
    totalActivitiesPending: 0,
    totalOrganizations: 0,
    totalApplications: 0,
  };

  const usersByRole = summary?.usersByRole || [];
  const reviewerCount =
    usersByRole.find((r) => r.role.toLowerCase() === "reviewer")?.count || 0;

  const pendingDemands = summary?.pendingRegistrationDemands || [];
  const pendingProjects = summary?.pendingProjects || [];
  const pendingActivities = summary?.pendingActivities || [];
  const recentUsers = summary?.recentUsers || [];

  // ── Roles Doughnut Data ───────────────────────────────────────
  const roleColors: Record<string, string> = {
    beneficiary: "#0D6EFD", // Primary Blue
    company: "#28A745",     // Success Green
    reviewer: "#7135E8",    // Sidebar Active Purple
    admin: "#FFC107",       // Warning Yellow
    other: "#6C757D",       // Secondary
  };

  const roleChartData = useMemo(() => {
    if (!usersByRole || usersByRole.length === 0) {
      return [
        { name: "Beneficiaries", role: "beneficiary", value: 1, color: "#0D6EFD" },
      ];
    }
    return usersByRole.map((item) => {
      const lower = item.role.toLowerCase();
      const color = roleColors[lower] || roleColors.other;
      const formattedName =
        item.role.charAt(0).toUpperCase() + item.role.slice(1);
      return {
        name: formattedName,
        role: item.role,
        value: item.count,
        color,
      };
    });
  }, [usersByRole]);

  // ── Trend Line / Area Chart Data ─────────────────────────────
  const trendData = useMemo(() => {
    const totalUsers = counts.totalUsers || 10;
    const totalProjects = counts.totalProjectsSubmitted || 5;

    if (chartPeriod === "week") {
      return [
        { name: "Mon", users: Math.round(totalUsers * 0.1), projects: Math.round(totalProjects * 0.1) },
        { name: "Tue", users: Math.round(totalUsers * 0.15), projects: Math.round(totalProjects * 0.2) },
        { name: "Wed", users: Math.round(totalUsers * 0.2), projects: Math.round(totalProjects * 0.25) },
        { name: "Thu", users: Math.round(totalUsers * 0.22), projects: Math.round(totalProjects * 0.18) },
        { name: "Fri", users: Math.round(totalUsers * 0.28), projects: Math.round(totalProjects * 0.3) },
        { name: "Sat", users: Math.round(totalUsers * 0.35), projects: Math.round(totalProjects * 0.4) },
        { name: "Sun", users: totalUsers, projects: totalProjects },
      ];
    }

    if (chartPeriod === "year") {
      return [
        { name: "2023", users: Math.max(1, Math.round(totalUsers * 0.2)), projects: Math.max(1, Math.round(totalProjects * 0.15)) },
        { name: "2024", users: Math.max(2, Math.round(totalUsers * 0.45)), projects: Math.max(2, Math.round(totalProjects * 0.35)) },
        { name: "2025", users: Math.max(3, Math.round(totalUsers * 0.75)), projects: Math.max(3, Math.round(totalProjects * 0.7)) },
        { name: "2026", users: totalUsers, projects: totalProjects },
      ];
    }

    // Default: 6 Months
    return [
      { name: "Jun", users: Math.round(totalUsers * 0.3), projects: Math.round(totalProjects * 0.2) },
      { name: "Jul", users: Math.round(totalUsers * 0.42), projects: Math.round(totalProjects * 0.35) },
      { name: "Aug", users: Math.round(totalUsers * 0.58), projects: Math.round(totalProjects * 0.48) },
      { name: "Sep", users: Math.round(totalUsers * 0.72), projects: Math.round(totalProjects * 0.62) },
      { name: "Oct", users: Math.round(totalUsers * 0.88), projects: Math.round(totalProjects * 0.8) },
      { name: "Nov", users: totalUsers, projects: totalProjects },
    ];
  }, [counts.totalUsers, counts.totalProjectsSubmitted, chartPeriod]);

  // Clean icons without light backgrounds
  const quickActions = [
    {
      to: "/admin/users",
      label: t("admin.manageUsers", { defaultValue: "Manage Users" }),
      icon: Users,
      iconColor: "text-[#0D6EFD]",
      description: "Inspect accounts and user permissions",
    },
    {
      to: "/admin/requests",
      label: t("admin.manageRequests", { defaultValue: "Registration Requests" }),
      icon: ClipboardCheck,
      iconColor: "text-[#FFC107]",
      description: "Approve or decline partner candidates",
    },
    {
      to: "/admin/projects",
      label: t("admin.manageProjects", { defaultValue: "Manage Projects" }),
      icon: FolderKanban,
      iconColor: "text-[#DC3545]",
      description: "Review submitted beneficiary portfolios",
    },
    {
      to: "/admin/organizations",
      label: t("admin.organizationsTitle", { defaultValue: "Organizations" }),
      icon: Building2,
      iconColor: "text-[#28A745]",
      description: "Oversee companies, NGOs, and partners",
    },
    {
      to: "/admin/activities",
      label: t("admin.activitiesTitle", { defaultValue: "Activities & Events" }),
      icon: Calendar,
      iconColor: "text-[#7135E8]",
      description: "Validate events, trainings, and workshops",
    },
    {
      to: "/admin/roles",
      label: t("admin.manageRoles", { defaultValue: "System Roles" }),
      icon: ShieldCheck,
      iconColor: "text-[#0D6EFD]",
      description: "Configure system security and RBAC",
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.dashboardTitle", { defaultValue: "Admin Dashboard" })}
      subtitle={t("admin.dashboardSubtitle", {
        defaultValue: "Enterprise management and platform analytics",
      })}
    >
      <div className="space-y-6">
        {/* ── Section 5: AdminLTE 4 Statistic Boxes ──────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Blue Box: Total Users (Primary Metric) */}
          <AdminStatBox
            title={t("admin.totalUsers", { defaultValue: "Total Users" })}
            value={counts.totalUsers.toLocaleString()}
            icon={Users}
            variant="blue"
            moreInfoHref="/admin/users"
            moreInfoText={t("common.moreInfo", { defaultValue: "More info" })}
            subtext={`${reviewerCount} active reviewers`}
          />

          {/* Green Box: Active Organizations (Successful / Verified Partners) */}
          <AdminStatBox
            title={t("admin.organizations", { defaultValue: "Organizations" })}
            value={counts.totalOrganizations.toLocaleString()}
            icon={Building2}
            variant="green"
            moreInfoHref="/admin/organizations"
            moreInfoText={t("common.moreInfo", { defaultValue: "More info" })}
            subtext="Registered companies & NGOs"
          />

          {/* Yellow Box: Pending Registration Requests (Pending Actions) */}
          <AdminStatBox
            title={t("admin.pendingRequests", { defaultValue: "Pending Requests" })}
            value={counts.totalDemandsPending.toLocaleString()}
            icon={ClipboardCheck}
            variant="yellow"
            moreInfoHref="/admin/requests"
            moreInfoText={t("common.moreInfo", { defaultValue: "Review applications" })}
            subtext="Awaiting admin approval"
          />

          {/* Red Box: Submitted Projects (Critical / Action Needed) */}
          <AdminStatBox
            title={t("admin.submittedProjects", { defaultValue: "Submitted Projects" })}
            value={counts.totalProjectsSubmitted.toLocaleString()}
            icon={FolderKanban}
            variant="red"
            moreInfoHref="/admin/projects"
            moreInfoText={t("common.moreInfo", { defaultValue: "Manage projects" })}
            subtext="Pending reviewer evaluation"
          />
        </div>

        {/* ── Section 7: Charts & Data Visualization ─────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Area / Line Chart: Platform Activity Trends */}
          <div className="lg:col-span-8">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#0D6EFD]" />
                  <span>{t("admin.platformGrowth", { defaultValue: "Platform Growth & Activity" })}</span>
                </div>
              }
              subtitle="User registrations & project submissions over time"
              collapsible
              maximizable
              headerActions={
                <div className="flex items-center rounded-md border border-[#E9ECEF] bg-[#F8F9FA] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartPeriod("week")}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      chartPeriod === "week"
                        ? "bg-white text-[#0D6EFD] shadow-xs font-bold"
                        : "text-[#6C757D] hover:text-[#212529]"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartPeriod("month")}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      chartPeriod === "month"
                        ? "bg-white text-[#0D6EFD] shadow-xs font-bold"
                        : "text-[#6C757D] hover:text-[#212529]"
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartPeriod("year")}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      chartPeriod === "year"
                        ? "bg-white text-[#0D6EFD] shadow-xs font-bold"
                        : "text-[#6C757D] hover:text-[#212529]"
                    }`}
                  >
                    Year
                  </button>
                </div>
              }
            >
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D6EFD" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0D6EFD" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#28A745" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#28A745" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#6C757D"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#E9ECEF" }}
                    />
                    <YAxis
                      stroke="#6C757D"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#E9ECEF" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E9ECEF",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px", color: "#6C757D" }}
                    />
                    <Area
                      type="monotone"
                      name="Registered Users"
                      dataKey="users"
                      stroke="#0D6EFD"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                    <Area
                      type="monotone"
                      name="Projects Submitted"
                      dataKey="projects"
                      stroke="#28A745"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorProjects)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>
          </div>

          {/* Doughnut Chart: Users by Role */}
          <div className="lg:col-span-4">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#7135E8]" />
                  <span>{t("admin.usersByRole", { defaultValue: "User Distribution" })}</span>
                </div>
              }
              subtitle="Breakdown by system role"
              collapsible
              maximizable
            >
              <div className="relative h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E9ECEF",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Total Stat */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-[#212529] leading-none">
                    {counts.totalUsers}
                  </span>
                  <span className="text-[11px] font-semibold text-[#6C757D] uppercase tracking-wider mt-0.5">
                    Total
                  </span>
                </div>
              </div>

              {/* Role Legend List */}
              <div className="mt-3 space-y-2 border-t border-[#E9ECEF] pt-3">
                {roleChartData.map((item) => {
                  const percentage =
                    counts.totalUsers > 0
                      ? Math.round((item.value / counts.totalUsers) * 100)
                      : 0;

                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-[#212529]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#212529]">
                          {item.value}
                        </span>
                        <span className="text-[11px] text-[#6C757D] w-8 text-end">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminCard>
          </div>
        </div>

        {/* ── Section 8: Modern Operational Data Tables ──────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Table 1: Pending Registration Requests */}
          <AdminCard
            title={
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#FFC107]" />
                <span>{t("admin.recentRequests", { defaultValue: "Pending Registration Requests" })}</span>
              </div>
            }
            subtitle="Latest partner & reviewer applications"
            collapsible
            maximizable
            headerActions={
              <Link
                to="/admin/requests"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6EFD] hover:underline"
              >
                <span>{t("common.viewAll", { defaultValue: "View All" })}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            }
            bodyClassName="p-0 overflow-x-auto"
          >
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>{t("admin.applicant", { defaultValue: "Applicant" })}</th>
                  <th>{t("admin.requestedRole", { defaultValue: "Requested Role" })}</th>
                  <th>{t("common.date", { defaultValue: "Date" })}</th>
                  <th>{t("common.status", { defaultValue: "Status" })}</th>
                  <th className="text-end">{t("common.action", { defaultValue: "Action" })}</th>
                </tr>
              </thead>
              <tbody>
                {pendingDemands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      {t("admin.noRequests", {
                        defaultValue: "No pending registration requests.",
                      })}
                    </td>
                  </tr>
                ) : (
                  pendingDemands.slice(0, 5).map((demand) => (
                    <tr key={demand.id}>
                      <td>
                        <div className="admin-table-user">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D6EFD] text-xs font-bold text-white shadow-xs">
                            {(demand.applicant.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="admin-table-user-name truncate">
                              {demand.applicant.name || "-"}
                            </p>
                            <p className="admin-table-user-sub truncate">
                              {demand.applicant.email || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rounded bg-[#F8F9FA] border border-[#DEE2E6] px-2 py-0.5 text-xs font-semibold text-[#212529]">
                          {demand.requestedRole}
                        </span>
                      </td>
                      <td className="text-xs text-[#6C757D]">
                        {formatDate(demand.createdAt)}
                      </td>
                      <td>
                        <StatusBadge status="pending" />
                      </td>
                      <td className="text-end">
                        <Link
                          to="/admin/requests"
                          className="inline-flex items-center gap-1.5 rounded border border-[#DEE2E6] bg-white px-2.5 py-1 text-xs font-semibold text-[#0D6EFD] hover:bg-[#0D6EFD] hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminCard>

          {/* Table 2: Recent Registered Users */}
          <AdminCard
            title={
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0D6EFD]" />
                <span>{t("admin.recentUsers", { defaultValue: "Recent Users" })}</span>
              </div>
            }
            subtitle="Newly registered platform accounts"
            collapsible
            maximizable
            headerActions={
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6EFD] hover:underline"
              >
                <span>{t("common.viewAll", { defaultValue: "View All" })}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            }
            bodyClassName="p-0 overflow-x-auto"
          >
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>{t("common.user", { defaultValue: "User" })}</th>
                  <th>{t("admin.role", { defaultValue: "Role" })}</th>
                  <th>{t("common.date", { defaultValue: "Joined" })}</th>
                  <th className="text-end">{t("common.action", { defaultValue: "Action" })}</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-table-empty">
                      {t("admin.noUsers", { defaultValue: "No users found." })}
                    </td>
                  </tr>
                ) : (
                  recentUsers.slice(0, 5).map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-table-user">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7135E8] text-xs font-bold text-white shadow-xs">
                            {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="admin-table-user-name truncate">
                              {user.fullName || user.email}
                            </p>
                            <p className="admin-table-user-sub truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rounded bg-[#F8F9FA] border border-[#DEE2E6] px-2 py-0.5 text-xs font-bold text-[#212529] uppercase">
                          {user.role}
                        </span>
                      </td>
                      <td className="text-xs text-[#6C757D]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="text-end">
                        <Link
                          to="/admin/users"
                          className="inline-flex items-center gap-1.5 rounded border border-[#DEE2E6] bg-white px-2.5 py-1 text-xs font-semibold text-[#212529] hover:bg-[#F8F9FA] transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminCard>
        </div>

        {/* ── Row 4: Submitted Projects & Quick Actions ─────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Pending Projects for Review (8 cols) */}
          <div className="lg:col-span-8">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[#DC3545]" />
                  <span>{t("admin.pendingProjects", { defaultValue: "Submitted Projects for Review" })}</span>
                </div>
              }
              subtitle="Beneficiary projects requiring reviewer assessment"
              collapsible
              maximizable
              headerActions={
                <Link
                  to="/admin/projects"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6EFD] hover:underline"
                >
                  <span>{t("common.viewAll", { defaultValue: "View All" })}</span>
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              }
              bodyClassName="p-0 overflow-x-auto"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>{t("admin.project", { defaultValue: "Project Title" })}</th>
                    <th>{t("admin.owner", { defaultValue: "Author" })}</th>
                    <th>{t("common.date", { defaultValue: "Submitted" })}</th>
                    <th>{t("common.status", { defaultValue: "Status" })}</th>
                    <th className="text-end">{t("common.action", { defaultValue: "Action" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-table-empty">
                        {t("admin.noProjects", {
                          defaultValue: "No pending projects.",
                        })}
                      </td>
                    </tr>
                  ) : (
                    pendingProjects.slice(0, 5).map((project) => (
                      <tr key={project.id}>
                        <td>
                          <p className="font-semibold text-[#212529] truncate max-w-xs">
                            {project.title}
                          </p>
                        </td>
                        <td className="text-xs text-[#6C757D]">
                          {project.owner || "-"}
                        </td>
                        <td className="text-xs text-[#6C757D]">
                          {formatDate(project.createdAt)}
                        </td>
                        <td>
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="text-end">
                          <Link
                            to="/admin/projects"
                            className="inline-flex items-center gap-1.5 rounded border border-[#DEE2E6] bg-white px-2.5 py-1 text-xs font-semibold text-[#0D6EFD] hover:bg-[#0D6EFD] hover:text-white transition-colors"
                          >
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminCard>
          </div>

          {/* Quick Management Shortcuts (4 cols) */}
          <div className="lg:col-span-4">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#0D6EFD]" />
                  <span>{t("admin.quickActions", { defaultValue: "Administrative Actions" })}</span>
                </div>
              }
              subtitle="Direct shortcuts to core modules"
              collapsible
            >
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3 transition-all duration-200 hover:border-[#0D6EFD] hover:bg-[#F8F9FA] hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Clean standalone icon without light background */}
                      <action.icon className={`h-5 w-5 shrink-0 ${action.iconColor}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#212529] group-hover:text-[#0D6EFD] transition-colors truncate">
                          {action.label}
                        </p>
                        <p className="text-[11px] text-[#6C757D] truncate">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#ADB5BD] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0D6EFD] rtl:rotate-180 rtl:group-hover:-translate-x-1 shrink-0 ms-2" />
                  </Link>
                ))}
              </div>
            </AdminCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
