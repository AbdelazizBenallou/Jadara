import { createFileRoute } from "@tanstack/react-router";
import { BeneficiaryRegisterPage } from "@/features/auth/BeneficiaryRegisterPage";

export const Route = createFileRoute("/register/beneficiary")({
  head: () => ({ meta: [{ title: "Create Beneficiary Account — Jadara" }] }),
  component: BeneficiaryRegisterPage,
});
