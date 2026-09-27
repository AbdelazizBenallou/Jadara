import { createFileRoute } from "@tanstack/react-router";
import { BeneficiaryDashboard } from "@/features/profile/BeneficiaryDashboard";

export const Route = createFileRoute("/dashboard/")({
  component: BeneficiaryDashboard,
});
