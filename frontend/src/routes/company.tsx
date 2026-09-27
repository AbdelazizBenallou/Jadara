import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/constants/roles";

export const Route = createFileRoute("/company")({
  component: CompanyLayout,
});

function CompanyLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (user.role !== "company") {
      navigate({
        to: ROLE_HOME[user.role as keyof typeof ROLE_HOME] || "/unsupported",
      });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user || user.role !== "company") {
    return null;
  }

  return <Outlet />;
}
