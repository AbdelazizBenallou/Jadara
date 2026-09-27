import { createFileRoute } from "@tanstack/react-router";
import { CompanyDashboard } from "@/features/company/CompanyDashboard";

export const Route = createFileRoute("/company/")({
  component: CompanyDashboard,
});
