import { createFileRoute } from "@tanstack/react-router";
import { AdminSubDomains } from "@/features/admin/AdminSubDomains";

export const Route = createFileRoute("/admin/sub-domains")({
  component: AdminSubDomains,
});
