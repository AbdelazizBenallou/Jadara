import { createFileRoute } from "@tanstack/react-router";
import { CompanyRegisterPage } from "@/features/auth/CompanyRegisterPage";

export const Route = createFileRoute("/register/company")({
  head: () => ({ meta: [{ title: "Company Registration — Jadara" }] }),
  component: CompanyRegisterPage,
});
