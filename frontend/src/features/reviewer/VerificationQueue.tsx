import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { apiClient } from "@/api/client";

interface ReviewProject {
  id: number;
  title: string;
  description?: string | null;
  status?: string;
  created_at?: string | null;
  user?: {
    id: number;
    email?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      headline?: string | null;
      avatar_url?: string | null;
    } | null;
  } | null;
  domain?: {
    id: number;
    name: string;
  } | null;
}

interface AvailableReview {
  id: number;
  project_id: number;
  status: string;
  submitted_at: string;
  rating?: {
    average: number | null;
    count: number;
  };
  project: ReviewProject;
}

interface ReviewResponse {
  data?: unknown;
  reviews?: unknown;
  items?: unknown;
  results?: unknown;
  total?: number;
  count?: number;
}

function extractArray<T>(response: ReviewResponse | T[] | undefined): T[] {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  if (Array.isArray(response.reviews)) {
    return response.reviews as T[];
  }

  if (Array.isArray(response.items)) {
    return response.items as T[];
  }

  if (Array.isArray(response.results)) {
    return response.results as T[];
  }

  return [];
}

function getPersonName(project?: ReviewProject | null, t?: any) {
  const profile = project?.user?.profile;

  if (!profile) {
    return project?.user?.email || (t ? t("reviewer.unknownTalent", { defaultValue: "Unknown talent" }) : "Unknown talent");
  }

  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return name || project?.user?.email || (t ? t("reviewer.unknownTalent", { defaultValue: "Unknown talent" }) : "Unknown talent");
}

function getInitials(project?: ReviewProject | null, t?: any) {
  const profile = project?.user?.profile;
  const defaultInitials = t ? t("reviewer.initials", { defaultValue: "JT" }) : "JT";

  if (!profile) return defaultInitials;

  const first = profile.first_name?.charAt(0) ?? "";
  const last = profile.last_name?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || defaultInitials;
}

function formatDate(value?: string | null, lng?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(lng || undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(status?: string, t?: any) {
  if (!status) return t ? t("status.pending", { defaultValue: "Pending" }) : "Pending";

  if (t) {
    const key = `status.${status.toLowerCase()}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function VerificationQueue() {
  const { t, i18n } = useTranslation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const query = useQuery({
    queryKey: ["reviewer", "verification-queue"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews/available");
      return response.data as ReviewResponse | AvailableReview[];
    },
  });

  const reviews = useMemo(
    () => extractArray<AvailableReview>(query.data),
    [query.data],
  );

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const project = review.project;
      const talentName = getPersonName(project, t);

      const matchesSearch =
        !normalizedSearch ||
        project?.title?.toLowerCase().includes(normalizedSearch) ||
        talentName.toLowerCase().includes(normalizedSearch) ||
        project?.user?.email?.toLowerCase().includes(normalizedSearch) ||
        project?.domain?.name?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        review.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [reviews, search, statusFilter]);

  const submittedCount = reviews.filter(
    (review) =>
      review.status?.toLowerCase() === "submitted",
  ).length;

  const pendingCount = reviews.length;

  return (
    <DashboardLayout
      role="reviewer"
      title={t("reviewer.queue.title", {
        defaultValue: "Verification Queue",
      })}
      subtitle={t("reviewer.queue.subtitle", {
        defaultValue:
          "Review submitted projects and verify evidence from talent.",
      })}
    >
      <div className="space-y-6">
        {/* Page intro */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <ClipboardCheck className="h-6 w-6 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("reviewer.queue.heading", {
                    defaultValue: "Projects awaiting verification",
                  })}
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {t("reviewer.queue.description", {
                    defaultValue:
                      "Review each submission carefully, inspect the available evidence, and provide a fair rating and feedback.",
                  })}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
              <Clock3 className="h-4 w-4 text-slate-500" />

              <div>
                <p className="text-xs font-medium text-slate-500">
                  {t("reviewer.queue.pendingLabel", {
                    defaultValue: "Pending",
                  })}
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {query.isLoading ? "—" : pendingCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {query.isLoading ? "—" : pendingCount}
                </p>

                <p className="text-sm text-slate-500">
                  {t("reviewer.queue.stats.pending", {
                    defaultValue: "Waiting for review",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <FileCheck2 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {query.isLoading ? "—" : submittedCount}
                </p>

                <p className="text-sm text-slate-500">
                  {t("reviewer.queue.stats.submitted", {
                    defaultValue: "Submitted",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {query.isLoading ? "—" : filteredReviews.length}
                </p>

                <p className="text-sm text-slate-500">
                  {t("reviewer.queue.stats.visible", {
                    defaultValue: "Matching submissions",
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search + filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("reviewer.queue.searchPlaceholder", {
                  defaultValue:
                    "Search by project, talent, email, or domain...",
                })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white ps-10 pe-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="all">
                {t("reviewer.queue.filters.all", {
                  defaultValue: "All statuses",
                })}
              </option>

              <option value="submitted">
                {t("reviewer.queue.filters.submitted", {
                  defaultValue: "Submitted",
                })}
              </option>

              <option value="under_review">
                {t("reviewer.queue.filters.underReview", {
                  defaultValue: "Under review",
                })}
              </option>
            </select>
          </div>
        </section>

        {/* Error */}
        {query.isError && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h3 className="font-semibold text-red-900">
                  {t("reviewer.queue.error.title", {
                    defaultValue: "Unable to load the verification queue",
                  })}
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  {t("reviewer.queue.error.description", {
                    defaultValue:
                      "Please refresh the page and try again.",
                  })}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Queue */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  {t("reviewer.queue.listTitle", {
                    defaultValue: "Verification requests",
                  })}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {query.isLoading
                    ? t("reviewer.queue.loading", {
                        defaultValue: "Loading submissions...",
                      })
                    : `${filteredReviews.length} submission${
                        filteredReviews.length === 1 ? "" : "s"
                      }`}
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
                <ShieldCheck className="h-4 w-4" />
                {t("reviewer.queue.secureReview", {
                  defaultValue: "Secure review",
                })}
              </div>
            </div>
          </div>

          {query.isLoading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="h-11 w-11 rounded-full bg-slate-100" />

                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-slate-100" />
                      <div className="h-3 w-1/4 rounded bg-slate-100" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                {search || statusFilter !== "all" ? (
                  <Search className="h-6 w-6 text-emerald-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                )}
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                {search || statusFilter !== "all"
                  ? t("reviewer.queue.empty.filteredTitle", {
                      defaultValue: "No matching submissions",
                    })
                  : t("reviewer.queue.empty.title", {
                      defaultValue: "Queue is clear",
                    })}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                {search || statusFilter !== "all"
                  ? t("reviewer.queue.empty.filteredDescription", {
                      defaultValue:
                        "Try changing your search or status filter.",
                    })
                  : t("reviewer.queue.empty.description", {
                      defaultValue:
                        "There are no projects waiting for verification right now.",
                    })}
              </p>

              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("reviewer.queue.clearFilters", {
                    defaultValue: "Clear filters",
                  })}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReviews.map((review) => {
                const project = review.project;
                const talentName = getPersonName(project, t);

                return (
                  <article
                    key={review.id}
                    className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        {/* Avatar */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {project?.user?.profile?.avatar_url ? (
                            <img
                              src={project.user.profile.avatar_url}
                              alt={talentName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(project, t)
                          )}
                        </div>

                        {/* Main content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-slate-900">
                              {project?.title || t("reviewer.untitledProject", { defaultValue: "Untitled project" })}
                            </h3>

                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <Clock3 className="h-3 w-3" />
                              {normalizeStatus(review.status, t)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />
                              {talentName}
                            </span>

                            {project?.domain?.name && (
                              <span>
                                {project.domain.name}
                              </span>
                            )}

                            <span>
                              {formatDate(review.submitted_at, i18n.language)}
                            </span>
                          </div>

                          {project?.description && (
                            <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <Link
                        to="/reviewer/project/$id"
                        params={{ id: String(review.id) }}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <ClipboardCheck className="h-4 w-4" />

                        {t("reviewer.queue.reviewProject", {
                          defaultValue: "Review project",
                        })}

                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}