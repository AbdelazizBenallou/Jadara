import { createFileRoute } from "@tanstack/react-router";
import { AdminRoles } from "@/features/admin/AdminRoles";

export const Route = createFileRoute("/admin/roles")({
  component: AdminRoles,
});
