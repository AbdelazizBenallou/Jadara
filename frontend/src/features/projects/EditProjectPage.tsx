import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Edit, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectForm } from "./components/ProjectForm";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { Project } from "@/types/project";
import { EmptyState } from "@/components/common/EmptyState";
import { STATUS } from "@/constants/statusTypes";

export function EditProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // We'll mock the useParams since TanStack Router parses it from the route definition
  // But we need to make sure the route actually exists. For now, we assume it's passed via route params.
  const { id } = useParams({ strict: false });
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
    fetchProject();
  }, [projectId]);

  if (loading) {
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
          isSubmitting={isSubmitting}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await apiClient.patch(`/projects/${projectId}`, data);
              toast.success(t("projects.updatedSuccess", "Project updated successfully"));
              navigate({ to: "/dashboard/projects/$id", params: { id: String(project.id) } });
            } catch (err: any) {
              toast.error(err.response?.data?.message || "Failed to update project");
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
