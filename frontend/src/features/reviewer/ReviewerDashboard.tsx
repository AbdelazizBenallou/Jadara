import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Star,
  Users,
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

interface ReviewHistoryItem {
  id: number;
  project_id: number;
  rating: number;
  feedback?: string | null;
  created_at: string;
  project_average?: number | null;
  project_rating_count?: number;
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
    return t ? t("reviewer.unknownTalent", { defaultValue: "Unknown talent" }) : "Unknown talent";
  }

  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return fullName || project?.user?.email || (t ? t("reviewer.unknownTalent", { defaultValue: "Unknown talent" }) : "Unknown talent");
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

export default function ReviewerDashboard() {
  const { t, i18n } = useTranslation();

  const availableReviewsQuery = useQuery({
    queryKey: ["reviewer", "available-reviews"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews/available");
      return response.data as ReviewResponse | AvailableReview[];
    },
  });

  const historyQuery = useQuery({
    queryKey: ["reviewer", "review-history"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews/history");
      return response.data as ReviewResponse | ReviewHistoryItem[];
    },
  });

  const availableReviews = useMemo(
    () => extractArray<AvailableReview>(availableReviewsQuery.data),
    [availableReviewsQuery.data],
  );

  const reviewHistory = useMemo(
    () => extractArray<ReviewHistoryItem>(historyQuery.data),
    [historyQuery.data],
  );

  const pendingCount = availableReviews.length;
  const reviewedCount = reviewHistory.length;

  const averageRating = useMemo(() => {
    if (!reviewHistory.length) return null;

    const total = reviewHistory.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );

    return total / reviewHistory.length;
  }, [reviewHistory]);

  const isLoading =
    availableReviewsQuery.isLoading || historyQuery.isLoading;

  const hasError =
    availableReviewsQuery.isError || historyQuery.isError;

  return (
    <DashboardLayout
      role="reviewer"
      title={t("reviewer.dashboard.title", {
        defaultValue: "Reviewer Dashboard",
      })}
      subtitle={t("reviewer.dashboard.subtitle", {
        defaultValue:
          "Review submitted projects and help verify skills on JADARA.",
      })}
    >
      <div className="space-y-8">
        {/* Welcome / overview */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-50 blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  {t("reviewer.dashboard.verifiedReview", {
                    defaultValue: "Verified Review",
                  })}
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {t("reviewer.dashboard.welcome", {
                    defaultValue: "Help verify real skills and experience.",
                  })}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  {t("reviewer.dashboard.welcomeDescription", {
                    defaultValue:
                      "Review submitted projects, assess evidence, and provide fair feedback that helps talent build a trusted profile.",
                  })}
                </p>
              </div>

              <Link
                to="/reviewer/queue"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ClipboardCheck className="h-4 w-4" />
                {t("reviewer.dashboard.openQueue", {
                  defaultValue: "Open Verification Queue",
                })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-2.5">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                {t("reviewer.dashboard.stats.pendingLabel", {
                  defaultValue: "Current",
                })}
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {isLoading ? "—" : pendingCount}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("reviewer.dashboard.stats.pending", {
                defaultValue: "Pending reviews",
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                {t("reviewer.dashboard.stats.completedLabel", {
                  defaultValue: "History",
                })}
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {isLoading ? "—" : reviewedCount}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("reviewer.dashboard.stats.completed", {
                defaultValue: "Reviews completed",
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Star className="h-5 w-5 text-blue-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                {t("reviewer.dashboard.stats.ratingLabel", {
                  defaultValue: "Average",
                })}
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {averageRating === null
                ? "—"
                : averageRating.toFixed(1)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("reviewer.dashboard.stats.averageRating", {
                defaultValue: "Your average rating",
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-violet-50 p-2.5">
                <Users className="h-5 w-5 text-violet-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                {t("reviewer.dashboard.stats.impactLabel", {
                  defaultValue: "Impact",
                })}
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-slate-900">
              {isLoading ? "—" : reviewedCount}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("reviewer.dashboard.stats.talentReviewed", {
                defaultValue: "Talent reviewed",
              })}
            </p>
          </div>
        </section>

        {/* Error */}
        {hasError && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <FileCheck2 className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h3 className="font-semibold text-red-900">
                  {t("reviewer.dashboard.error.title", {
                    defaultValue: "Unable to load reviewer data",
                  })}
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  {t("reviewer.dashboard.error.description", {
                    defaultValue:
                      "Please refresh the page and try again.",
                  })}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Pending reviews */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t("reviewer.dashboard.pendingTitle", {
                  defaultValue: "Pending Verification",
                })}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("reviewer.dashboard.pendingSubtitle", {
                  defaultValue:
                    "Projects waiting for your review.",
                })}
              </p>
            </div>

            <Link
              to="/reviewer/queue"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              {t("reviewer.dashboard.viewAll", {
                defaultValue: "View all",
              })}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t("reviewer.dashboard.loading", {
                  defaultValue: "Loading reviews...",
                })}
              </div>
            ) : availableReviews.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {t("reviewer.dashboard.empty.title", {
                    defaultValue: "You're all caught up",
                  })}
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  {t("reviewer.dashboard.empty.description", {
                    defaultValue:
                      "There are no projects waiting for verification right now.",
                  })}
                </p>
              </div>
            ) : (
              availableReviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                      {getInitials(review.project, t)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {review.project?.title || t("reviewer.untitledProject", { defaultValue: "Untitled project" })}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {getPersonName(review.project, t)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>
                          {formatDate(review.submitted_at, i18n.language)}
                        </span>

                        <span>•</span>

                        <span>
                          {normalizeStatus(review.status, t)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/reviewer/project/$id"
                    params={{ id: String(review.id) }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("reviewer.dashboard.review", {
                      defaultValue: "Review",
                    })}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent history */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">
              {t("reviewer.dashboard.recentTitle", {
                defaultValue: "Recent Reviews",
              })}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t("reviewer.dashboard.recentSubtitle", {
                defaultValue:
                  "Your latest completed project reviews.",
              })}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t("reviewer.dashboard.loadingHistory", {
                  defaultValue: "Loading review history...",
                })}
              </div>
            ) : reviewHistory.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t("reviewer.dashboard.noHistory", {
                  defaultValue:
                    "No completed reviews yet.",
                })}
              </div>
            ) : (
              reviewHistory.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {review.project?.title || t("reviewer.untitledProject", { defaultValue: "Untitled project" })}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {getPersonName(review.project, t)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <Star className="h-4 w-4 fill-current" />
                      {Number(review.rating || 0).toFixed(1)}
                    </div>

                    <span className="text-xs text-slate-400">
                      {formatDate(review.created_at, i18n.language)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}