import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, FolderGit2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./components/ProjectCard";
import { EmptyState } from "@/components/common/EmptyState";
import { apiClient } from "@/api/client";
import type { Project } from "@/types/project";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProjectListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.get("/projects");
        setProjects(res.data.data || []);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || t("projects.fetchError", "Failed to fetch projects"),
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [t]);

  return (
    <DashboardLayout role="beneficiary" title={t("exp.projects")} subtitle={t("projects.subtitle")}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">
              {t("projects.myProjects")} ({projects.length})
            </h2>
          </div>
          <Button asChild className="gap-2">
            <Link to="/dashboard/projects/new">
              <Plus className="h-4 w-4" />
              {t("common.add")}
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="h-10 w-10 text-muted-foreground/50" />}
            title={t("projects.emptyTitle")}
            description={t("projects.emptyDesc")}
            action={t("projects.addFirst")}
            onAction={() => {
              navigate({ to: "/dashboard/projects/new" });
            }}
          />
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
