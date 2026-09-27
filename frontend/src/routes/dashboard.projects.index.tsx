import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage } from "@/features/projects/ProjectListPage";

export const Route = createFileRoute("/dashboard/projects/")({
  component: ProjectListPage,
});
