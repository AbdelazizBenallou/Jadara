import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, FolderGit2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./components/ProjectCard";
import { EmptyState } from "@/components/common/EmptyState";
import { listProjects } from "@/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { Loader2 } from "lucide-react";

export function ProjectListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => listProjects(),
  });

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("exp.projects")}
      subtitle={t("projects.subtitle")}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-[#7135E8]" />
            <h2 className="text-base font-bold text-[#212529]">
              {t("projects.myProjects", { defaultValue: "My Projects & Evidence" })} ({projects.length})
            </h2>
          </div>
          <Button asChild className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5">
            <Link to="/dashboard/projects/new">
              <Plus className="h-4 w-4" />
              {t("common.add", { defaultValue: "Add Project" })}
            </Link>
          </Button>
        </div>

        {isLoading ? (
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
