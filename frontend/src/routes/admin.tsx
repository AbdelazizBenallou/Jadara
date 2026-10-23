import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/constants/roles";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
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
    } else if (user.role !== "admin") {
      navigate({ to: ROLE_HOME[user.role as keyof typeof ROLE_HOME] || "/unsupported" });
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading || !user || user.role !== "admin") {
    return null;
  }

  return <Outlet />;
}
