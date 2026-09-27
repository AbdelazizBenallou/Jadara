import { createFileRoute } from "@tanstack/react-router";
import ReviewProject from "@/features/reviewer/ReviewProject";

export const Route = createFileRoute("/reviewer/project/$id")({
  component: ReviewProject,
});
