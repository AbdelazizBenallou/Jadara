import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  MapPin,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyVolunteerApplications } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

export function MyApplicationsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.volunteering.myApplications,
    queryFn: () => getMyVolunteerApplications(),
  });

  const applications = response?.items || (response as any)?.data || [];

  // Filter applications
  const filteredApps = useMemo(() => {
    return applications.filter((app: any) => {
      const titleMatch = (app.activity?.title || "").toLowerCase().includes(search.toLowerCase());
      const orgMatch = (app.activity?.organization?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesSearch = titleMatch || orgMatch;

      const matchesStatus =
        statusFilter === "all" || (app.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((a: any) => (a.status || "").toLowerCase() === "accepted").length;
    const pending = applications.filter((a: any) => (a.status || "").toLowerCase() === "pending").length;
    const rejected = applications.filter((a: any) => (a.status || "").toLowerCase() === "rejected").length;
    return { total, accepted, pending, rejected };
  }, [applications]);

  return (
    <DashboardLayout
      role="beneficiary"
      title="My Applications"
      subtitle="Track your submissions, organization approvals, and volunteer mission status."
    >
      <div className="space-y-6">
        {/* ── Summary Metrics Row (Strictly NO tinted boxes) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-[#7135E8]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.total}</p>
                <p className="text-xs text-[#6C757D]">Total Applications</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.accepted}</p>
                <p className="text-xs text-[#6C757D]">Accepted Missions</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-[#F5B51B]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.pending}</p>
                <p className="text-xs text-[#6C757D]">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <HeartHandshake className="h-5 w-5 text-[#0D6EFD]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">
                  {new Set(applications.map((a: any) => a.activity?.organization?.id).filter(Boolean)).size}
                </p>
                <p className="text-xs text-[#6C757D]">NGO Partners</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters & Search Bar ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#E9ECEF] bg-white p-3 shadow-xs">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADB5BD]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by mission or NGO..."
              className="ps-9 border-[#E9ECEF] text-xs h-9 bg-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "accepted", label: "Accepted" },
              { id: "pending", label: "Pending" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap",
                    active
                      ? "bg-[#7135E8] text-white"
                      : "text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#212529] border border-[#E9ECEF]",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Applications Content ──────────────────────────────── */}
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#E9ECEF] bg-white p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#7135E8]" />
            <p className="mt-3 text-xs font-semibold text-[#6C757D]">
              Loading your applications...
            </p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
            <HeartHandshake className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
            <h3 className="text-base font-bold text-[#212529]">
              {search || statusFilter !== "all"
                ? "No applications match your filter"
                : "No volunteering applications yet"}
            </h3>
            <p className="text-xs text-[#6C757D] mt-1 max-w-md mx-auto">
              {search || statusFilter !== "all"
                ? "Try clearing your search keyword or selecting a different status filter."
                : "Browse active volunteering opportunities from verified organizations on the homepage feed and apply to join missions."}
            </p>
            <div className="mt-5">
              <Link to="/">
                <Button className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5">
                  <HeartHandshake className="h-4 w-4" />
                  <span>Explore Volunteering Missions</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app: any) => {
              const act = app.activity || {};
              const org = act.organization || {};
              const isAccepted = (app.status || "").toLowerCase() === "accepted";
              const isPending = (app.status || "").toLowerCase() === "pending";

              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-xs hover:border-[#7135E8] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Mission Details */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/volunteering/activities/$activityId"
                          params={{ activityId: String(act.id) }}
                          className="text-base font-bold text-[#212529] hover:text-[#7135E8] hover:underline transition-colors"
                        >
                          {act.title}
                        </Link>
                        {act.category && (
                          <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold text-[#6C757D]">
                            {act.category.name}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6C757D]">
                        <span className="flex items-center gap-1 font-semibold text-[#212529]">
                          <Building2 className="h-3.5 w-3.5 text-[#7135E8]" />
                          <span>{org.name || "Partner Organization"}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
                          <span>{act.location || "Algeria"}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[#0D6EFD]" />
                          <span>
                            {act.start_date ? formatDate(act.start_date) : "TBD"} - {act.end_date ? formatDate(act.end_date) : "TBD"}
                          </span>
                        </span>
                      </div>

                      {act.description && (
                        <p className="text-xs text-[#6C757D] line-clamp-2 leading-relaxed">
                          {act.description}
                        </p>
                      )}

                      {/* Required Skills */}
                      {act.required_skills && act.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {act.required_skills.map((skill: any) => (
                            <span
                              key={skill.id}
                              className="rounded border border-[#E9ECEF] bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-semibold text-[#495057]"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 border-[#E9ECEF] pt-3 sm:pt-0">
                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize border",
                            isAccepted
                              ? "bg-white text-[#16A34A] border-[#16A34A]"
                              : isPending
                              ? "bg-white text-[#B45309] border-[#F5B51B]"
                              : "bg-white text-[#6C757D] border-[#E9ECEF]",
                          )}
                        >
                          {isAccepted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                          ) : isPending ? (
                            <Clock className="h-3.5 w-3.5 text-[#F5B51B]" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-[#6C757D]" />
                          )}
                          <span>{app.status}</span>
                        </span>
                        <p className="text-[11px] text-[#6C757D] mt-1">
                          Submitted on {app.application_date ? formatDate(app.application_date) : "N/A"}
                        </p>
                      </div>

                      <Link
                        to="/volunteering/activities/$activityId"
                        params={{ activityId: String(act.id) }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E9ECEF] text-xs font-semibold text-[#7135E8] hover:bg-[#F8F9FA] gap-1"
                        >
                          <span>Mission Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
