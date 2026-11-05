import { useState, useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, ArrowLeft, Globe, User, Settings, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Role } from "@/constants/roles";
import { Sidebar } from "./Sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { CompanyLayout } from "./CompanyLayout";
import { AdminLayout } from "./AdminLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (role === "admin") {
    return (
      <RoleGuard role={role}>
        <AdminLayout title={title} subtitle={subtitle} actions={actions}>
          {children}
        </AdminLayout>
      </RoleGuard>
    );
  }

  if (role === "company") {
    return (
      <RoleGuard role={role}>
        <CompanyLayout>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="mb-6 flex justify-end">{actions}</div>}
          {children}
        </CompanyLayout>
      </RoleGuard>
    );
  }

  // Deduplicate user name
  const cleanFullName = useMemo(() => {
    const rawFirst = (
      user?.profile?.first_name ||
      user?.name ||
      "Beneficiary"
    ).trim();
    const rawLast = (user?.profile?.last_name || "").trim();

    if (!rawLast) return rawFirst;
    if (rawFirst.toLowerCase() === rawLast.toLowerCase()) return rawFirst;
    if (rawFirst.toLowerCase().includes(rawLast.toLowerCase())) return rawFirst;
    return `${rawFirst} ${rawLast}`;
  }, [user]);

  const initials = useMemo(() => {
    const rawFirst = (
      user?.profile?.first_name ||
      user?.name ||
      "B"
    ).trim();
    const rawLast = (user?.profile?.last_name || "").trim();
    if (rawFirst && rawLast && rawFirst.toLowerCase() !== rawLast.toLowerCase()) {
      return (rawFirst.charAt(0) + rawLast.charAt(0)).toUpperCase();
    }
    return rawFirst.charAt(0).toUpperCase() || "J";
  }, [user]);

  const avatarUrl =
    user?.profile?.avatar_url ||
    user?.profile?.avatar ||
    (typeof window !== "undefined"
      ? localStorage.getItem("admin_avatar_url")
      : null);

  return (
    <RoleGuard role={role}>
      <div className="flex min-h-screen bg-[#F4F6F9] text-[#212529] font-sans antialiased">
        {/* Desktop AdminLTE-Style Dark Sidebar */}
        <Sidebar
          role={role}
          className="sticky top-0 hidden h-screen lg:flex shrink-0 z-30"
        />

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <Sidebar
              role={role}
              className="h-full z-50"
              onCloseMobile={() => setMobileOpen(false)}
            />
            <div
              className="flex-1 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        )}

        {/* Content Shell */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navbar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-[#E9ECEF] bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E9ECEF] text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#212529] lg:hidden transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                {backLink && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#6C757D] hover:text-[#212529]"
                  >
                    <Link to={backLink as string}>
                      <span className="sr-only">Go back</span>
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                )}
                <div>
                  <h1 className="text-sm font-bold text-[#212529] sm:text-base leading-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="hidden text-xs text-[#6C757D] sm:block">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Header Tools */}
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-1.5 border-[#E9ECEF] text-xs font-semibold text-[#7135E8] hover:bg-[#7135E8]/10 hover:text-[#7135E8] h-8"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{t("nav.home", { defaultValue: "Community Feed" })}</span>
                </Button>
              </Link>

              <LanguageSwitcher />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#7135E8]/20 transition-all focus:outline-none"
                    aria-label="User profile menu"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={cleanFullName}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-[#E9ECEF]"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7135E8] text-xs font-bold text-white shadow-xs">
                        {initials}
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 border-[#E9ECEF]">
                  <DropdownMenuLabel className="font-normal p-3 pb-2">
                    <p className="text-xs font-bold text-[#212529] truncate">{cleanFullName}</p>
                    <p className="text-[11px] text-[#6C757D] truncate mt-0.5">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer text-xs">
                      <User className="h-4 w-4 text-[#7135E8]" />
                      <span>{t("sidebar.profile", { defaultValue: "My Profile" })}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 cursor-pointer text-xs">
                      <Settings className="h-4 w-4 text-[#6C757D]" />
                      <span>{t("sidebar.settings", { defaultValue: "Settings" })}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      navigate({ to: "/" });
                    }}
                    className="flex items-center gap-2 cursor-pointer text-xs text-[#DC3545] focus:text-[#DC3545]"
                  >
                    <LogOut className="h-4 w-4 rtl:rotate-180" />
                    <span>{t("nav.logout", { defaultValue: "Logout" })}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Page Area */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {actions && <div className="mb-4 flex justify-end">{actions}</div>}
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
