import { createFileRoute } from "@tanstack/react-router";
import { AdminProfilePage } from "@/features/admin/AdminProfilePage";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfilePage,
});
