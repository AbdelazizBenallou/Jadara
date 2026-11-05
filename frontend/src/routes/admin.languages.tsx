import { createFileRoute } from "@tanstack/react-router";
import { AdminLanguages } from "@/features/admin/AdminLanguages";

export const Route = createFileRoute("/admin/languages")({
  component: AdminLanguages,
});
