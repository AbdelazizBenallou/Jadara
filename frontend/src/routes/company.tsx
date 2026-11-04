import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/company")({
  component: CompanyRoute,
});

function CompanyRoute() {
  return (
    <RoleGuard role="company">
      <Outlet />
    </RoleGuard>
  );
}
