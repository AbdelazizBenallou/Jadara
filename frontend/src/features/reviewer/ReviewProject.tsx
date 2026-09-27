import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { apiClient } from "@/api/client";

interface Profile {
  first_name: string;
  last_name: string;
  headline?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
}

interface ReviewUser {
  id: number;
  email: string;
  profile: Profile | null;
}

interface ReviewDomain {
  id: number;
  name: string;
}

interface Evidence {
  id: number;
  project_id: number;
  type: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  download_url?: string | null;
}

interface Project {
  id: number;
  title: string;
  description: string;
  status?: string;
  created_at?: string | null;
  user: ReviewUser;
  domain?: ReviewDomain | null;
  evidence?: Evidence[];
}

interface Review {
  id: number;
  rating: number;
  feedback: string | null;
  created_at: string;
  reviewer?: ReviewUser;
}

interface ProjectReviewResponse {
  id: number;
  project_id: number;
  status: string;
  rating: {
    average: number | null;
    count: number;
  };
  reviews: Review[];
  project: Project;
}

interface ReviewFormValues {
  rating: number;
  feedback: string;
}

function getResponseData<T>(value: unknown): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value
  ) {
    return (value as { data: T }).data;
  }

  return value as T;
}

function getTalentName(user?: ReviewUser | null, t?: any) {
  if (!user) return t ? t("reviewer.unknownTalent", { defaultValue: "Unknown talent" }) : "Unknown talent";

  const profile = user.profile;

  if (!profile) {
    return user.email;
  }

  const fullName =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return fullName || user.email;
}

function getInitials(user?: ReviewUser | null, t?: any) {
  const profile = user?.profile;
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
    month: "long",
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

function getEvidenceIcon(type?: string) {
  const normalized = type?.toLowerCase() ?? "";

  if (
    normalized.includes("image") ||
    normalized.includes("photo") ||
    normalized.includes("screenshot")
  ) {
    return ImageIcon;
  }

  if (
    normalized.includes("pdf") ||
    normalized.includes("document") ||
    normalized.includes("file")
  ) {
    return FileText;
  }

  return Paperclip;
}

export default function ReviewProject() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const params = useParams({ strict: false });

  const reviewId =
    params.id ??
    params.reviewId ??
    "";

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const query = useQuery({
    queryKey: ["reviewer", "review-project", reviewId],
    enabled: Boolean(reviewId),
    queryFn: async () => {
      const response = await apiClient.get(
        `/reviews/${reviewId}`,
      );

      const data = getResponseData<any>(
        response.data,
      );

      if (data?.project?.users) {
        data.project.user = {
          id: data.project.users.id,
          email: data.project.users.email,
          profile: data.project.users.profiles,
        };
      }

      return data as ProjectReviewResponse;
    },
  });

  const reviewData = query.data;
  const project = reviewData?.project;

  const existingReview = useMemo(() => {
    if (!reviewData?.reviews?.length) {
      return null;
    }

    return reviewData.reviews[0];
  }, [reviewData]);

  const evidence = project?.evidence ?? [];

  const isAlreadyReviewed = Boolean(existingReview);

  const displayRating =
    rating || existingReview?.rating || 0;

  const displayFeedback =
    feedback || existingReview?.feedback || "";

  const handleSubmit = async () => {
    if (!reviewId || rating < 1) {
      setSubmitError(
        t("reviewer.reviewProject.validation.rating", {
          defaultValue:
            "Please select a rating before submitting.",
        }),
      );

      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (existingReview) {
        await apiClient.put(
          `/reviews/${reviewId}/rate`,
          {
            rating,
            feedback,
          },
        );
      } else {
        await apiClient.post(
          `/reviews/${reviewId}/rate`,
          {
            rating,
            feedback,
          },
        );
      }

      await query.refetch();

      setShowConfirm(false);

      navigate({
        to: "/reviewer",
      });
    } catch (error: any) {
      setSubmitError(
        error?.response?.data?.message ||
          t("reviewer.reviewProject.submitError", {
            defaultValue:
              "Unable to submit your review. Please try again.",
          }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (query.isLoading) {
    return (
      <DashboardLayout
        role="reviewer"
        title={t("reviewer.reviewProject.title", {
          defaultValue: "Verification Review",
        })}
      >
        <div className="space-y-6">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="mt-4 h-8 w-2/3 rounded bg-slate-100" />
            <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-5 w-40 rounded bg-slate-100" />
              <div className="mt-5 h-24 rounded bg-slate-100" />
              <div className="mt-5 h-24 rounded bg-slate-100" />
            </div>

            <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-5 w-32 rounded bg-slate-100" />
              <div className="mt-5 h-32 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (query.isError || !project) {
    return (
      <DashboardLayout
        role="reviewer"
        title={t("reviewer.reviewProject.title", {
          defaultValue: "Verification Review",
        })}
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <FileCheck2 className="h-6 w-6 text-red-600" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-red-900">
            {t("reviewer.reviewProject.error.title", {
              defaultValue: "Unable to load this project",
            })}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
            {t("reviewer.reviewProject.error.description", {
              defaultValue:
                "The project could not be loaded. Please return to the verification queue and try again.",
            })}
          </p>

          <Link
            to="/reviewer/queue"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("reviewer.reviewProject.backToQueue", {
              defaultValue: "Back to queue",
            })}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const talentName = getTalentName(project.user, t);

  return (
    <DashboardLayout
      role="reviewer"
      title={t("reviewer.reviewProject.title", {
        defaultValue: "Verification Review",
      })}
      subtitle={t("reviewer.reviewProject.subtitle", {
        defaultValue:
          "Review the project, inspect the evidence, and submit your assessment.",
      })}
      backLink="/reviewer/queue"
      actions={
        <Link
          to="/reviewer/queue"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("reviewer.reviewProject.queue", {
            defaultValue: "Queue",
          })}
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Project header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    {normalizeStatus(reviewData.status, t)}
                  </span>

                  {project.domain?.name && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {project.domain.name}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {project.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {talentName}
                  </span>

                  <span>
                    {t("reviewer.reviewProject.submitted", {
                      defaultValue: "Submitted",
                    })}{" "}
                    {formatDate(project.created_at, i18n.language)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />

                <div>
                  <p className="text-xs font-medium text-emerald-700">
                    {t("reviewer.reviewProject.verification", {
                      defaultValue: "Verification",
                    })}
                  </p>

                  <p className="text-sm font-bold text-emerald-900">
                    {t("reviewer.reviewProject.assessmentRequired", {
                      defaultValue: "Assessment required",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Project overview */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      {t("reviewer.reviewProject.overview.title", {
                        defaultValue: "Project Overview",
                      })}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {t("reviewer.reviewProject.overview.subtitle", {
                        defaultValue:
                          "Understand the project before assessing its evidence.",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {project.description ||
                    t("reviewer.reviewProject.overview.noDescription", {
                      defaultValue:
                        "No project description was provided.",
                    })}
                </p>
              </div>
            </section>

            {/* Talent */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-50 p-2.5">
                    <UserRound className="h-5 w-5 text-violet-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      {t("reviewer.reviewProject.talent.title", {
                        defaultValue: "Talent",
                      })}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {t("reviewer.reviewProject.talent.subtitle", {
                        defaultValue:
                          "Information about the person behind this project.",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {project.user.profile?.avatar_url ? (
                      <img
                        src={project.user.profile.avatar_url}
                        alt={talentName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(project.user, t)
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {talentName}
                    </h3>

                    {project.user.profile?.headline && (
                      <p className="mt-1 text-sm text-slate-600">
                        {project.user.profile.headline}
                      </p>
                    )}

                    {project.user.profile?.location && (
                      <p className="mt-1 text-xs text-slate-400">
                        {project.user.profile.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Evidence */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-2.5">
                      <FileCheck2 className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        {t("reviewer.reviewProject.evidence.title", {
                          defaultValue: "Project Evidence",
                        })}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {t("reviewer.reviewProject.evidence.subtitle", {
                          defaultValue:
                            "Review the supporting material submitted with this project.",
                        })}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    {evidence.length}{" "}
                    {t("reviewer.reviewProject.evidence.items", {
                      defaultValue: "items",
                    })}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {evidence.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <Paperclip className="mx-auto h-6 w-6 text-slate-400" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {t("reviewer.reviewProject.evidence.emptyTitle", {
                        defaultValue: "No evidence attached",
                      })}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t(
                        "reviewer.reviewProject.evidence.emptyDescription",
                        {
                          defaultValue:
                            "This project does not contain any supporting files.",
                        },
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((item) => {
                      const EvidenceIcon =
                        getEvidenceIcon(item.type);

                      const fileUrl =
                        item.download_url ||
                        item.file_url ||
                        "";

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="rounded-lg bg-slate-100 p-2.5">
                              <EvidenceIcon className="h-5 w-5 text-slate-600" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-800">
                                {item.title}
                              </h3>

                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                                <span>
                                  {normalizeStatus(item.type, t)}
                                </span>
                              </div>

                              {item.description && (
                                <p className="mt-2 text-sm leading-5 text-slate-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {fileUrl && (
                            <div className="flex shrink-0 items-center gap-2">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {t("reviewer.reviewProject.evidence.open", {
                                  defaultValue: "Open",
                                })}
                              </a>

                              {item.download_url && (
                                <a
                                  href={item.download_url}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  {t(
                                    "reviewer.reviewProject.evidence.download",
                                    {
                                      defaultValue: "Download",
                                    },
                                  )}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Existing reviews */}
            {reviewData.reviews?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2.5">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        {t("reviewer.reviewProject.existingReviews.title", {
                          defaultValue: "Existing Reviews",
                        })}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {t(
                          "reviewer.reviewProject.existingReviews.subtitle",
                          {
                            defaultValue:
                              "Previous reviewer assessments for this project.",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {reviewData.reviews.map((review) => (
                    <div key={review.id} className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <UserRound className="h-4 w-4 text-slate-500" />
                          </div>

                          <span className="text-sm font-semibold text-slate-800">
                            {review.reviewer
                              ? getTalentName(review.reviewer, t)
                              : t(
                                  "reviewer.reviewProject.existingReviews.reviewer",
                                  {
                                    defaultValue: "Reviewer",
                                  },
                                )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                          <Star className="h-4 w-4 fill-current" />
                          {review.rating}/5
                        </div>
                      </div>

                      {review.feedback && (
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {review.feedback}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-slate-400">
                        {formatDate(review.created_at, i18n.language)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Review panel */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900 p-2.5">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      {isAlreadyReviewed
                        ? t("reviewer.reviewProject.update.title", {
                            defaultValue: "Update Your Review",
                          })
                        : t("reviewer.reviewProject.form.title", {
                            defaultValue: "Your Assessment",
                          })}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {isAlreadyReviewed
                        ? t(
                            "reviewer.reviewProject.update.subtitle",
                            {
                              defaultValue:
                                "You can update your rating and feedback.",
                            },
                          )
                        : t(
                            "reviewer.reviewProject.form.subtitle",
                            {
                              defaultValue:
                                "Rate the project based on the submitted evidence.",
                            },
                          )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {/* Rating */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-800">
                      {t("reviewer.reviewProject.form.rating", {
                        defaultValue: "Project rating",
                      })}
                    </label>

                    <span className="text-xs font-medium text-slate-400">
                      {displayRating
                        ? `${displayRating}/5`
                        : t(
                            "reviewer.reviewProject.form.selectRating",
                            {
                              defaultValue: "Select rating",
                            },
                          )}
                    </span>
                  </div>

                  <div
                    className="mt-3 flex items-center gap-1"
                    role="radiogroup"
                    aria-label="Project rating"
                  >
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active =
                        value <= displayRating;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className="rounded-lg p-2 transition hover:bg-amber-50"
                          aria-label={`${value} out of 5`}
                          aria-pressed={value === displayRating}
                        >
                          <Star
                            className={`h-7 w-7 ${
                              active
                                ? "fill-current text-amber-500"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                    <span>
                      {t("reviewer.reviewProject.form.low", {
                        defaultValue: "Needs improvement",
                      })}
                    </span>

                    <span>
                      {t("reviewer.reviewProject.form.high", {
                        defaultValue: "Excellent",
                      })}
                    </span>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label
                    htmlFor="review-feedback"
                    className="text-sm font-semibold text-slate-800"
                  >
                    {t("reviewer.reviewProject.form.feedback", {
                      defaultValue: "Feedback",
                    })}
                  </label>

                  <textarea
                    id="review-feedback"
                    value={displayFeedback}
                    onChange={(event) =>
                      setFeedback(event.target.value)
                    }
                    rows={7}
                    placeholder={t(
                      "reviewer.reviewProject.form.feedbackPlaceholder",
                      {
                        defaultValue:
                          "Share constructive feedback about the project and evidence...",
                      },
                    )}
                    className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {t("reviewer.reviewProject.form.feedbackHint", {
                      defaultValue:
                        "Keep your feedback specific, fair, and useful to the talent.",
                    })}
                  </p>
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">
                      {submitError}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSubmitting || rating < 1}
                  onClick={() => setShowConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />

                  {isAlreadyReviewed
                    ? t("reviewer.reviewProject.update.button", {
                        defaultValue: "Update Review",
                      })
                    : t("reviewer.reviewProject.form.submit", {
                        defaultValue: "Submit Review",
                      })}
                </button>

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                  <p className="text-xs leading-5 text-slate-500">
                    {t("reviewer.reviewProject.form.privacy", {
                      defaultValue:
                        "Your assessment contributes to the talent's verified profile.",
                    })}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-confirm-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>

                <h2
                  id="review-confirm-title"
                  className="mt-4 text-lg font-bold text-slate-900"
                >
                  {isAlreadyReviewed
                    ? t(
                        "reviewer.reviewProject.confirm.updateTitle",
                        {
                          defaultValue: "Update your review?",
                        },
                      )
                    : t(
                        "reviewer.reviewProject.confirm.title",
                        {
                          defaultValue: "Submit your review?",
                        },
                      )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isAlreadyReviewed
                    ? t(
                        "reviewer.reviewProject.confirm.updateDescription",
                        {
                          defaultValue:
                            "Your new rating and feedback will replace your previous assessment.",
                        },
                      )
                    : t(
                        "reviewer.reviewProject.confirm.description",
                        {
                          defaultValue:
                            "Please make sure your rating and feedback are accurate before submitting.",
                        },
                      )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={t(
                  "reviewer.reviewProject.confirm.close",
                  {
                    defaultValue: "Close",
                  },
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    {t("reviewer.reviewProject.confirm.rating", {
                      defaultValue: "Rating",
                    })}
                  </span>

                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-amber-500" />
                    <span className="text-sm font-bold text-slate-900">
                      {rating}/5
                    </span>
                  </div>
                </div>

                {feedback.trim() && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <span className="text-xs font-medium text-slate-400">
                      {t(
                        "reviewer.reviewProject.confirm.feedback",
                        {
                          defaultValue: "Feedback",
                        },
                      )}
                    </span>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {feedback}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("reviewer.reviewProject.confirm.cancel", {
                    defaultValue: "Cancel",
                  })}
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t(
                        "reviewer.reviewProject.confirm.submitting",
                        {
                          defaultValue: "Submitting...",
                        },
                      )}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {isAlreadyReviewed
                        ? t(
                            "reviewer.reviewProject.confirm.update",
                            {
                              defaultValue: "Update Review",
                            },
                          )
                        : t(
                            "reviewer.reviewProject.confirm.submit",
                            {
                              defaultValue: "Submit Review",
                            },
                          )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}