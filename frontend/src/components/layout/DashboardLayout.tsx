import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/constants/roles";
import type { Role } from "@/constants/roles";
import { Sidebar } from "./Sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { CompanyLayout } from "./CompanyLayout";

export function DashboardLayout({
  role,
  title,
  subtitle,
  backLink,
  children,
  actions,
}: {
  role: Role;
  title: string;
  subtitle?: string;
  backLink?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    } else if (role && user.role !== role) {
      navigate({ to: ROLE_HOME[user.role as keyof typeof ROLE_HOME] || "/unsupported" });
    }
  }, [user, role, navigate]);

  if (!user || (role && user.role !== role)) return <LoadingSpinner />;

  if (role === "company") {
    return (
      <CompanyLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="mb-6 flex justify-end">{actions}</div>}
        {children}
      </CompanyLayout>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} className="sticky top-0 hidden h-screen lg:flex" />
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <Sidebar role={role} className="h-full" />
          <div className="flex-1 bg-foreground/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <div className="flex items-center gap-2">
                {backLink && (
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ms-2">
                    <Link to={backLink as string}>
                      <span className="sr-only">Go back</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="rtl:rotate-180"
                      >
                        <path
                          d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Link>
                  </Button>
                )}
                <h1 className="text-base font-bold leading-tight lg:text-lg">{title}</h1>
              </div>
              {subtitle && (
                <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Notifications removed because backend does not support it */}
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          {actions && <div className="mb-4 flex justify-end">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
