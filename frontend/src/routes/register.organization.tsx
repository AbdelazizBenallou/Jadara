import { createFileRoute } from "@tanstack/react-router";
import { OrganizationRegisterPage } from "@/features/auth/OrganizationRegisterPage";

export const Route = createFileRoute("/register/organization")({
  head: () => ({ meta: [{ title: "Organization Registration — Jadara" }] }),
  component: OrganizationRegisterPage,
});
