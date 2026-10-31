import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/constants/roles";

export const Route = createFileRoute("/reviewer")({
  component: ReviewerLayout,
});

function ReviewerLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({
        to: "/login",
        search: { redirect: location.pathname },
      });
    } else if (user.role !== "reviewer") {
      navigate({
        to: ROLE_HOME[user.role as keyof typeof ROLE_HOME] || "/unsupported",
      });
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading || !user || user.role !== "reviewer") {
    return null;
  }

  return <Outlet />;
}
