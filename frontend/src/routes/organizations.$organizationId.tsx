import { createFileRoute } from "@tanstack/react-router";
import { OrganizationProfilePage } from "@/features/volunteering/pages/OrganizationProfilePage";

export const Route = createFileRoute("/organizations/$organizationId")({
  component: OrganizationProfilePage,
});
