import { createFileRoute } from "@tanstack/react-router";
import { RoleSelectionPage } from "@/features/auth/RoleSelectionPage";

export const Route = createFileRoute("/register/")({
  head: () => ({ meta: [{ title: "Choose Role — Jadara" }] }),
  component: RoleSelectionPage,
});
