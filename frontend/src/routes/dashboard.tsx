import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RoleGuard role="beneficiary" allow={["/dashboard/settings"]}>
      <Outlet />
    </RoleGuard>
  );
}
