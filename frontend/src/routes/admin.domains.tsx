import { createFileRoute } from "@tanstack/react-router";
import { AdminDomains } from "@/features/admin/AdminDomains";

export const Route = createFileRoute("/admin/domains")({
  component: AdminDomains,
});
