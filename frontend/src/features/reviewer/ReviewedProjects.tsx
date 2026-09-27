import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { CheckCircle2, Clock3, Eye, FileText, Search, XCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { formatDate } from "@/utils/formatDate";
import { STATUS } from "@/constants/statusTypes";

import type { HistoryReview } from "./types";

export function ReviewedProjectsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [reviews, setReviews] = useState<HistoryReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get("/reviews/history");
        setReviews(res.data.data || []);
      } catch (err: unknown) {
        const error = err as AxiosError<{ message: string }>;
        const msg = error.response?.data?.message || t("reviewer.fetchHistoryError", { defaultValue: "Failed to fetch review history" });
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <DashboardLayout
      role="reviewer"
      title={t("reviewer.reviewedProjects", { defaultValue: "Reviewed Projects" })}
      subtitle={t("reviewer.reviewHistorySub", {
        defaultValue: "View the projects and submissions you have already reviewed.",
      })}
    >
      <div className="space-y-8">
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t("reviewer.reviewHistory", { defaultValue: "Review history" })}
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("reviewer.reviewedProjects", { defaultValue: "Reviewed Projects" })}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("reviewer.reviewHistorySubDesc", {
                defaultValue:
                  "Review your previous decisions and quickly access the submissions you have already evaluated.",
              })}
            </p>
          </div>

          <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 end-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        </section>

        {/* =====================================================
            PROJECTS
        ===================================================== */}

        <section>
          {loading ? (
            <div className="px-6 py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Search className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-semibold text-foreground">
                {t("reviewer.errorLoadingHistory", { defaultValue: "Error Loading History" })}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-semibold text-foreground">
                {t("reviewer.noReviewsYet", { defaultValue: "No reviews yet" })}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {t("reviewer.noHistoryDesc", {
                  defaultValue: "You haven't reviewed any projects yet.",
                })}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Card header */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {review.project.user.profile?.first_name ||
                            t("reviewer.unknown", { defaultValue: "Unknown" })}{" "}
                          {review.project.user.profile?.last_name || ""}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {t("reviewer.reviewedAt", { defaultValue: "Reviewed" })}{" "}
                          {formatDate(review.created_at, language)}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={review.project.status || "verified"} />
                  </div>

                  {/* Project information */}

                  <div className="mt-5">
                    <h3 className="truncate text-base font-bold">{review.project.title}</h3>
                  </div>

                  {/* Decision */}

                  <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>
                        {review.project.status === "approved"
                          ? t("reviewer.approved", { defaultValue: "Approved" })
                          : t("reviewer.verified", { defaultValue: "Verified" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-amber-500 font-bold">★ {review.rating}</span>
                      <span>/ 10</span>
                      <span className="text-xs ms-2 text-slate-400">
                        ({t("reviewer.avg", { defaultValue: "Avg" })}:{" "}
                        {review.project_average ?? "-"})
                      </span>
                    </div>
                  </div>

                  {/* Action */}

                  <div className="mt-5">
                    <Link
                      to="/reviewer/review-details/$reviewId"
                      params={{ reviewId: String(review.id) }}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {t("reviewer.viewDetails", { defaultValue: "View Details" })}
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
