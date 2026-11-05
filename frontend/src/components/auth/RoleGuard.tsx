import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME, type Role } from "@/constants/roles";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";

interface RoleGuardProps {
  role: Role;
  allow?: string[];
  children: ReactNode;
}

export function RoleGuard({ role, allow = [], children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hasRole = Boolean(user && user.role === role);
  const isAllowedPath = Boolean(
    user && allow.some((prefix) => location.pathname.startsWith(prefix)),
  );
  const isAllowed = hasRole || isAllowedPath;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (!isAllowed) {
      navigate({
        to: ROLE_HOME[user.role as keyof typeof ROLE_HOME] || "/unsupported",
        replace: true,
      });
    }
  }, [isLoading, user, isAllowed, navigate]);

  if (isLoading || !user || !isAllowed) {
    return <LoadingSpinner />;
  }

  return children;
}
