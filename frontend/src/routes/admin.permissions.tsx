import { createFileRoute } from "@tanstack/react-router";
import { AdminPermissions } from "@/features/admin/AdminPermissions";

export const Route = createFileRoute("/admin/permissions")({
  component: AdminPermissions,
});
