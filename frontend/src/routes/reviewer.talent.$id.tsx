import { createFileRoute } from "@tanstack/react-router";
import { TalentProfile } from "@/features/company/TalentProfile";

export const Route = createFileRoute("/reviewer/talent/$id")({
  component: TalentProfile,
});
