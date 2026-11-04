import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FolderPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectForm } from "./components/ProjectForm";
import { createProject } from "@/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { toast } from "sonner";

export function CreateProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      toast.success(
        t("projects.createdSuccess", "Project created successfully"),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      navigate({
        to: "/dashboard/projects/$id",
        params: { id: String(project.id) },
      });
    },
    onError: (err) => notifyError(err),
  });

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("projects.createTitle")}
      subtitle={t("projects.createSubtitle")}
      backLink="/dashboard/projects"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FolderPlus className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{t("projects.projectDetails")}</h2>
        </div>

        <ProjectForm
          submitLabel={t("common.createProject")}
          isSubmitting={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      </div>
    </DashboardLayout>
  );
}
