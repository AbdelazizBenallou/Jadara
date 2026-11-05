import { createFileRoute } from "@tanstack/react-router";
import { AdminActivities } from "@/features/admin/AdminActivities";

export const Route = createFileRoute("/admin/activities")({
  component: AdminActivities,
});
