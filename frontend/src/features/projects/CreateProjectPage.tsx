import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FolderPlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectForm } from "./components/ProjectForm";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

export function CreateProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          isSubmitting={isSubmitting}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              const res = await apiClient.post("/projects", data);
              toast.success(t("projects.createdSuccess", "Project created successfully"));
              navigate({ to: "/dashboard/projects/$id", params: { id: String(res.data.data.id) } });
            } catch (err: any) {
              toast.error(err.response?.data?.message || "Failed to create project");
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
