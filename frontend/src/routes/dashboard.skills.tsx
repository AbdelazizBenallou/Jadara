import { createFileRoute } from "@tanstack/react-router";
import { SkillsPage } from "@/features/skills/SkillsPage";

export const Route = createFileRoute("/dashboard/skills")({
  component: SkillsPage,
});
