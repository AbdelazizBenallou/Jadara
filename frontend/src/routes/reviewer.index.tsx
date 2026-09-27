import { createFileRoute } from "@tanstack/react-router";

import ReviewerDashboard from "@/features/reviewer/ReviewerDashboard";

export const Route = createFileRoute("/reviewer/")({
  component: ReviewerDashboard,
});