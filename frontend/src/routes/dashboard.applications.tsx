import { createFileRoute } from "@tanstack/react-router";
import { MyApplicationsPage } from "@/features/volunteering/pages/MyApplicationsPage";

export const Route = createFileRoute("/dashboard/applications")({
  component: MyApplicationsPage,
});
