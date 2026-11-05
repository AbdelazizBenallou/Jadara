import { createFileRoute } from "@tanstack/react-router";
import { AdminUserProfilePage } from "@/features/admin/AdminUserProfilePage";

export const Route = createFileRoute("/admin/users/$id")({
  component: AdminUserProfilePage,
});
