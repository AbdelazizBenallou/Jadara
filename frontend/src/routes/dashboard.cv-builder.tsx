import { createFileRoute } from "@tanstack/react-router";
import { CvBuilderPage } from "@/features/cv-builder/CvBuilderPage";

export const Route = createFileRoute("/dashboard/cv-builder")({
  component: CvBuilderPage,
});
