import { createFileRoute } from "@tanstack/react-router";
import { TalentProfile } from "@/features/company/TalentProfile";

export const Route = createFileRoute("/company/talent/$id")({
  component: TalentProfile,
});
