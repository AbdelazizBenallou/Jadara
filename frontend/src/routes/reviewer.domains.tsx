import { createFileRoute } from "@tanstack/react-router";
import AssignedDomains from "@/features/reviewer/AssignedDomains";

export const Route = createFileRoute("/reviewer/domains")({
  component: AssignedDomains,
});
