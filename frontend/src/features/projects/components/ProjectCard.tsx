import { Link } from "@tanstack/react-router";
import { FolderGit2, Calendar, Link2, ExternalLink, Github, Figma } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Project } from "@/types/project";
import { formatDate } from "@/utils/formatDate";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between gap-5">
      <div className="flex flex-1 gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FolderGit2 className="h-6 w-6 text-primary" />
        </div>

        <div className="space-y-2 flex-1">
          <div>
            <h3 className="font-bold text-lg text-text-primary" dir="auto">
              <Link
                to="/dashboard/projects/$id"
                params={{ id: String(project.id) }}
                className="hover:underline"
              >
                {project.title}
              </Link>
            </h3>
          </div>

          <p
            className="text-sm text-muted-foreground line-clamp-2 leading-relaxed max-w-3xl"
            dir="auto"
          >
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(project.created_at, i18n.language)}
            </span>
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Github className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">Github</span>
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
                <Link2 className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">Live</span>
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
                <Figma className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">Figma</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {project.status === "verified" && project.rating && project.rating.average > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-amber-500">
                ★ {project.rating.average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:border-s sm:ps-5 pt-4 sm:pt-0 border-t sm:border-t-0">
        <StatusBadge status={project.status} />

        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
          <Link to="/dashboard/projects/$id" params={{ id: String(project.id) }}>
            {t("common.viewDetails")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
