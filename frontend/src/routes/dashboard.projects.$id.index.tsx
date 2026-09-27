import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailsPage } from "@/features/projects/ProjectDetailsPage";

export const Route = createFileRoute("/dashboard/projects/$id/")({
  component: ProjectDetailsPage,
});
