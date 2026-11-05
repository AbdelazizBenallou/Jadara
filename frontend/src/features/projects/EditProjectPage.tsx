import { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Edit, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectForm } from "./components/ProjectForm";
import {
  getProject,
  updateProject,
  type ProjectUpdateInput,
} from "@/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";

export function EditProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams({ strict: false });
  const projectId = Number(id);

  const {
    data: project = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: Number.isFinite(projectId),
  });

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const updateMutation = useMutation({
    mutationFn: (data: ProjectUpdateInput) => updateProject(projectId, data),
    onSuccess: (updated) => {
      toast.success(
        t("projects.updatedSuccess", "Project updated successfully"),
      );
      queryClient.setQueryData(queryKeys.projects.detail(projectId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() });
      navigate({
        to: "/dashboard/projects/$id",
        params: { id: String(updated.id) },
      });
    },
    onError: (err) => notifyError(err),
  });

  if (isLoading) {
    return (
      <DashboardLayout role="beneficiary" title={t("projects.editTitle")}>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="beneficiary" title={t("projects.editTitle")}>
        <EmptyState
          icon={<Edit className="h-8 w-8 text-muted-foreground/50" />}
          title={t("projects.notFound")}
          description={t("projects.notFoundDesc")}
        />
      </DashboardLayout>
    );
  }

  if (project.status === "under_review" || project.status === "verified") {
    return (
      <DashboardLayout
        role="beneficiary"
        title={t("projects.editTitle")}
        backLink={`/dashboard/projects/${project.id}`}
      >
        <EmptyState
          icon={<Edit className="h-8 w-8 text-muted-foreground/50" />}
          title={t("projects.editTitle")}
          description={t("projects.lockedEdit")}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("projects.editTitle")}
      subtitle={t("projects.editSubtitle")}
      backLink={`/dashboard/projects/${project.id}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Edit className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{project.title}</h2>
        </div>

        <ProjectForm
          initialData={project}
          isSubmitting={updateMutation.isPending}
          onSubmit={(data) => updateMutation.mutate(data)}
        />
      </div>
    </DashboardLayout>
  );
}
