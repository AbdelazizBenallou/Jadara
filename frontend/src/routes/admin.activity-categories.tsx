import { createFileRoute } from "@tanstack/react-router";
import { AdminActivityCategories } from "@/features/admin/AdminActivityCategories";

export const Route = createFileRoute("/admin/activity-categories")({
  component: AdminActivityCategories,
});
