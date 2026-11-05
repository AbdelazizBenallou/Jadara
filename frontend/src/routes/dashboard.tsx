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
function DashboardLayout() {
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
