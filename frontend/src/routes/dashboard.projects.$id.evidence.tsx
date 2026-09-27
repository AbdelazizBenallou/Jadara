import { createFileRoute } from "@tanstack/react-router";
import { AddEvidencePage } from "@/features/projects/AddEvidencePage";

export const Route = createFileRoute("/dashboard/projects/$id/evidence")({
  component: AddEvidencePage,
});
