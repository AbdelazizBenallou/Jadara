import { createFileRoute } from "@tanstack/react-router";
import { AdminOrganizations } from "@/features/admin/AdminOrganizations";

export const Route = createFileRoute("/admin/organizations")({
  component: AdminOrganizations,
});
