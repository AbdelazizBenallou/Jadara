import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/reviewer")({
  component: ReviewerRoute,
});

function ReviewerRoute() {
  return (
    <RoleGuard role="reviewer">
      <Outlet />
    </RoleGuard>
  );
}
