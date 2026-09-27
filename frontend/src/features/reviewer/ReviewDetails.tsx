import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  FolderKanban,
  User,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import type { DetailedProjectReview } from "./types";

export default function ReviewDetails() {
  const { reviewId } = useParams({ strict: false }) as { reviewId: string };
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [review, setReview] = useState<DetailedProjectReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await apiClient.get(`/reviews/${reviewId}`);
        setReview(res.data.data);
      } catch (err: unknown) {
        const error = err as AxiosError<{ message: string }>;
        const msg = error.response?.data?.message || t("reviewer.fetchReviewError", { defaultValue: "Failed to fetch review details" });
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [reviewId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        role="reviewer"
        title={t("reviewer.reviewDetails.title", { defaultValue: "Review Details" })}
        backLink="/reviewer/reviewed"
      >
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t("reviewer.errorLoadingReview", { defaultValue: "Error Loading Review" })}</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!review) return null;

  const { project } = review;
  const existingReview = review.reviews?.find((r) => r.reviewer.id === user?.id);

  return (
    <DashboardLayout role="reviewer" title={t("reviewer.reviewDetails.title", { defaultValue: "Review Details" })} backLink="/reviewer/reviewed">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">REV-{review.id}</span>

              <span className="text-xs text-muted-foreground">•</span>

              <span className="text-xs font-medium text-muted-foreground">PRJ-{project.id}</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{t("reviewer.reviewDetails.title", { defaultValue: "Review Details" })}</h1>

            <p className="mt-2 text-sm text-muted-foreground">{t("reviewer.reviewDetails.recordFor", { defaultValue: "Review record for" })} {project.title}</p>
          </div>

          {existingReview && (
            <Link to="/reviewer/project/$id" params={{ id: String(project.id) }}>
              <Button>{t("reviewer.reviewDetails.editRating", { defaultValue: "Edit Rating" })}</Button>
            </Link>
          )}
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Project */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border px-5 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">{t("reviewer.reviewDetails.project", { defaultValue: "Project" })}</h2>

                  <p className="text-sm text-muted-foreground">{t("reviewer.reviewDetails.projectInfo", { defaultValue: "Submitted project information" })}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{project.title}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("reviewer.reviewDetails.projectId", { defaultValue: "Project ID" })}: PRJ-{project.id}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Beneficiary */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{t("reviewer.reviewDetails.beneficiary", { defaultValue: "Beneficiary" })}</p>

                  <p className="mt-1 font-semibold">
                    {project.user.profile?.first_name || t("reviewer.unknown", { defaultValue: "Unknown" })}
                    {""}
                    {project.user.profile?.last_name || ""}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">{project.user.email}</p>
                </div>
              </div>
            </section>

            {/* Evidence */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-5">
                <h2 className="font-semibold">{t("reviewer.reviewDetails.submittedEvidence", { defaultValue: "Submitted Evidence" })}</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("reviewer.reviewDetails.evidenceEval", { defaultValue: "Evidence that was evaluated during the review" })}
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {project.evidence?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-slate-600">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>

                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>

                    <a
                      href={item.download_url || item.file_url || ""}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                    >
                      {t("reviewer.reviewDetails.open", { defaultValue: "Open" })}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
                {(!project.evidence || project.evidence.length === 0) && (
                  <div className="p-5 text-center text-sm text-muted-foreground">
                    {t("reviewer.reviewDetails.noEvidence", { defaultValue: "No evidence provided" })}
                  </div>
                )}
              </div>
            </section>

            {/* Feedback */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">{t("reviewer.reviewDetails.reviewerFeedback", { defaultValue: "Reviewer Feedback" })}</h2>

              {review.reviews && review.reviews.length > 0 ? (
                review.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {t("reviewer.reviewDetails.rating", { defaultValue: "Rating" })}
                      </p>
                      <p className="text-lg font-bold text-amber-500">
                        ★ {rev.rating}
                        {""}
                        <span className="text-sm font-normal text-muted-foreground">/ 10</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {t("reviewer.reviewDetails.notes", { defaultValue: "Notes" })}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                        {rev.feedback || t("reviewer.reviewDetails.noFeedback", { defaultValue: "No feedback provided." })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mt-4 rounded-xl border p-4 border-slate-200 bg-slate-50">
                  <p className="text-sm leading-7 text-slate-700">{t("reviewer.reviewDetails.noReviews", { defaultValue: "No reviews yet." })}</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Review information */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">{t("reviewer.reviewDetails.reviewInfo", { defaultValue: "Review Information" })}</h2>

              <div className="mt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">{t("reviewer.reviewDetails.reviewed", { defaultValue: "Reviewed" })}</p>

                    {review.reviews && review.reviews.length > 0
                      ? formatDate(review.reviews[0].created_at, i18n.language)
                      : t("reviewer.reviewDetails.na", { defaultValue: "N/A" })}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">{t("reviewer.reviewDetails.reviewer", { defaultValue: "Reviewer" })}</p>

                    <p className="mt-1 text-sm font-medium">{t("reviewer.reviewDetails.you", { defaultValue: "You" })}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">{t("reviewer.reviewDetails.timeline", { defaultValue: "Review Timeline" })}</h2>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FolderKanban className="h-4 w-4" />
                    </div>

                    <div className="absolute left-1/2 top-8 h-8 w-px -translate-x-1/2 bg-slate-200" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{t("reviewer.reviewDetails.projectSubmitted", { defaultValue: "Project submitted" })}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{t("reviewer.reviewDetails.reviewCompleted", { defaultValue: "Review completed" })}</p>

                    {review.reviews && review.reviews.length > 0
                      ? formatDate(review.reviews[0].created_at, i18n.language)
                      : t("reviewer.reviewDetails.na", { defaultValue: "N/A" })}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
