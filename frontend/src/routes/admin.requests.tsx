import { createFileRoute } from "@tanstack/react-router";
import { AdminRequestsPage } from "@/features/admin/requests/AdminRequestsPage";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequestsPage,
});
