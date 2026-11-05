import { createFileRoute } from "@tanstack/react-router";
import { SavedMissionsPage } from "@/features/volunteering/pages/SavedMissionsPage";

export const Route = createFileRoute("/saved")({
  component: SavedMissionsPage,
});
