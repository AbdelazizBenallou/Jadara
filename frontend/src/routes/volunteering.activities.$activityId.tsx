import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetailsPage } from "@/features/volunteering/pages/ActivityDetailsPage";

export const Route = createFileRoute("/volunteering/activities/$activityId")({
  component: ActivityDetailsPage,
});
