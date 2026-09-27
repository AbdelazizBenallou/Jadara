import { createFileRoute } from "@tanstack/react-router";
import { EditProjectPage } from "@/features/projects/EditProjectPage";

export const Route = createFileRoute("/dashboard/projects/$id/edit")({
  component: EditProjectPage,
});
