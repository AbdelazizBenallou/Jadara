import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { ROLE_HOME } from "@/constants/roles";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (user.role !== "beneficiary") {
      // If not beneficiary, they can ONLY access /dashboard/settings
      if (!location.pathname.startsWith("/dashboard/settings")) {
        navigate({ to: ROLE_HOME[user.role as keyof typeof ROLE_HOME] || "/unsupported" });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading || !user) {
    return null;
  }

  if (user.role !== "beneficiary" && !location.pathname.startsWith("/dashboard/settings")) {
    return null;
  }

  return <Outlet />;
}
