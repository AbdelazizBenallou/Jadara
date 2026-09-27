import { createFileRoute } from "@tanstack/react-router";
import { ReviewedProjectsPage } from "@/features/reviewer/ReviewedProjects";

export const Route = createFileRoute("/reviewer/reviewed")({
  component: ReviewedProjectsPage,
});
