import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  FolderGit2,
  Calendar,
  Link2,
  ExternalLink,
  FileText,
  CheckCircle2,
  ShieldAlert,
  FilePlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { EmptyState } from "@/components/common/EmptyState";
import { STATUS } from "@/constants/statusTypes";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { Project, Evidence } from "@/types/project";

export function ProjectDetailsPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams({ strict: false });
  const projectId = Number(id);
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}`);
      setProject(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const deleteProject = async () => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success(t("common.deleteSuccess", "Project deleted successfully"));
      navigate({ to: "/dashboard/projects" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    }
  };

  const removeEvidence = async (evidenceId: number) => {
    try {
      await apiClient.delete(`/projects/${projectId}/evidence/${evidenceId}`);
      toast.success(t("common.deleteSuccess", "Evidence removed successfully"));
      fetchProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove evidence");
    }
  };

  const submitForVerification = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/projects/${projectId}/submit`);
      toast.success(t("projects.submitSuccess", "Project submitted for verification"));
      fetchProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="beneficiary" title={t("projects.detailsTitle")}>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="beneficiary" title={t("projects.detailsTitle")}>
        <EmptyState
          icon={<FolderGit2 className="h-8 w-8 text-muted-foreground/50" />}
          title={t("projects.notFound")}
          description={t("projects.notFoundDesc")}
        />
      </DashboardLayout>
    );
  }

  const attachedDocs = project.evidence || [];

  return (
    <DashboardLayout
      role="beneficiary"
      title={project.title}
      subtitle={t("projects.detailsSubtitle")}
      backLink="/dashboard/projects"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FolderGit2 className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold" dir="auto">
                {project.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(project.created_at, i18n.language)}
                </span>
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Link2 className="h-4 w-4" />
                    Github
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Link2 className="h-4 w-4" />
                    Live
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {project.figma_url && (
                  <a
                    href={project.figma_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Link2 className="h-4 w-4" />
                    Figma
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
            <StatusBadge status={project.status} />
            <div className="flex gap-2">
              {project.status !== STATUS.UNDER_REVIEW && project.status !== STATUS.VERIFIED && (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/projects/$id/edit" params={{ id: String(project.id) }}>
                      {t("common.edit")}
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold mb-3">{t("common.description")}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" dir="auto">
                {project.description}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold mb-3">{t("projects.domain", "Domain")}</h2>
              <div className="flex flex-wrap gap-2">
                {project.domains ? (
                  <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium">
                    {project.domains.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">{t("common.none", "None")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold mb-4">{t("common.proof")}</h2>

              {attachedDocs.length > 0 ? (
                <div className="space-y-4">
                  {attachedDocs.map((doc: any) => {
                    return (
                      <div key={doc.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <FileText className="h-8 w-8 text-primary shrink-0" />
                            <div className="min-w-0 flex-1">
                              {(doc as any).download_url || (doc as any).file_url ? (
                                <a
                                  href={(doc as any).download_url || (doc as any).file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-sm font-medium text-primary hover:underline flex items-center gap-1.5"
                                >
                                  {doc.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <p className="truncate text-sm font-medium">{doc.title}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {t("projects.uploaded")} {formatDate(doc.created_at, i18n.language)}
                              </p>
                            </div>
                          </div>
                          {project.status !== STATUS.VERIFIED &&
                            project.status !== STATUS.UNDER_REVIEW && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEvidence(doc.id)}
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </div>
                    );
                  })}

                  {project.status === "draft" && (
                    <Button asChild variant="outline" className="w-full gap-2 mt-4">
                      <Link
                        to="/dashboard/projects/$id/evidence"
                        params={{ id: String(project.id) }}
                      >
                        <FilePlus className="h-4 w-4" />
                        {t("common.addMoreEvidence")}
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
                  <div className="rounded-full bg-muted p-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t("common.noProof")}</p>
                    <p className="text-xs text-muted-foreground mt-1 px-4">
                      {t("projects.attachInfo")}
                    </p>
                  </div>
                  {project.status === "draft" && (
                    <Button asChild size="sm" className="mt-2 gap-2">
                      <Link to="/dashboard/projects/$id/evidence" params={{ id: String(project.id) }}>
                        <FilePlus className="h-4 w-4" />
                        {t("common.attachProof")}
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {(project.status === "draft" || project.status === STATUS.UNDER_REVIEW || project.status === STATUS.VERIFIED) && (
                <div className="mt-6 pt-4 border-t border-border space-y-4">
                  {project.status === "draft" && (
                    <>
                      {attachedDocs.length === 0 && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
                          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                          <p>{t("projects.evidenceRequiredToSubmit", "You must add at least one evidence item before you can submit this project for verification.")}</p>
                        </div>
                      )}
                      <Button
                        className="w-full gap-2"
                        onClick={() => submitForVerification()}
                        disabled={isSubmitting || attachedDocs.length === 0}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {t("common.submitVerify")}
                      </Button>
                    </>
                  )}

                  {project.status === STATUS.UNDER_REVIEW && (
                    <div className="flex items-center gap-2 rounded-lg bg-info/10 p-3 text-sm text-info-foreground border border-info/20">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <p>{t("projects.underReviewInfo")}</p>
                    </div>
                  )}

                  {project.status === STATUS.VERIFIED && (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <p>{t("projects.verifiedInfo")}</p>
                    </div>
                  )}
                </div>
              )}

              {project.status === STATUS.VERIFIED &&
                (project as any).reviews &&
                (project as any).reviews.length > 0 && (
                  <div className="mt-6 rounded-lg bg-slate-50 p-5 text-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-base text-slate-800">
                        {t("projects.reviewerFeedback", "Reviewer Feedback")}
                      </p>
                      {project.rating && project.rating.average > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {t("projects.averageRating", "Average Rating")}
                          </span>
                          <span className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                            ★ {project.rating.average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6 mt-4">
                      {(project as any).reviews.map((rev: any) => (
                        <div
                          key={rev.id}
                          className="border-t border-slate-200 pt-4 first:border-0 first:pt-0"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                              {t("projects.rating", "Rating")}
                            </span>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              ★ {rev.rating}{" "}
                              <span className="text-muted-foreground text-xs font-normal">
                                / 10
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                              {t("projects.feedback", "Feedback")}
                            </p>
                            <p className="leading-relaxed whitespace-pre-wrap text-slate-700">
                              {rev.feedback ||
                                t("projects.noFeedback", "No feedback was provided.")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-soft mx-4">
            <h3 className="text-lg font-bold mb-2">{t("common.delete")}</h3>
            <p className="text-muted-foreground mb-6" dir="auto">
              {t("projects.deleteConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteProject();
                }}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
