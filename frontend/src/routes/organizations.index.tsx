import { createFileRoute } from "@tanstack/react-router";
import { OrganizationsDirectoryPage } from "@/features/volunteering/pages/OrganizationsDirectoryPage";

export const Route = createFileRoute("/organizations/")({
  component: OrganizationsDirectoryPage,
});
