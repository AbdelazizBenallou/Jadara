import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { HomePage } from "@/features/home/HomePage";
import { SocialHomePage } from "@/features/volunteering/pages/SocialHomePage";

export function IndexRouteComponent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user?.role?.toLowerCase() === "admin") {
      navigate({ to: "/admin" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return null;
  }

  if (user && user.role?.toLowerCase() !== "admin") {
    return <SocialHomePage />;
  }

  return <HomePage />;
}

export const Route = createFileRoute("/")({
  component: IndexRouteComponent,
});
