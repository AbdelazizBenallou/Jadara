import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  Globe,
  Home,
  Key,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardSummary } from "@/api/dashboard";
import { queryKeys } from "@/lib/query-keys";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AdminQuickSearch } from "@/components/admin/AdminQuickSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number | string | null;
  badgeVariant?: "primary" | "warning" | "danger" | "success" | "purple";
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  badge?: number | string | null;
};

type NavSection = {
  label?: string;
  items: (NavItem | NavGroup)[];
};

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item && Array.isArray((item as NavGroup).items);
}

export function AdminLayout({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });

  const [isDesktop, setIsDesktop] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    management: true,
    activities: false,
    catalog: false,
    system: false,
  });

  // Fetch summary to power badges
  const { data: summary } = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60 * 2,
  });

  const pendingDemandsCount = summary?.counts?.totalDemandsPending || 0;
  const pendingProjectsCount = summary?.counts?.totalProjectsSubmitted || 0;
  const pendingActivitiesCount = summary?.counts?.totalActivitiesPending || 0;
  const totalNotifications = pendingDemandsCount + pendingProjectsCount + pendingActivitiesCount;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.add("admin-active");
    return () => document.body.classList.remove("admin-active");
  }, []);

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    if (isDesktop) {
      setCollapsed((value) => !value);
    } else {
      setMobileOpen((value) => !value);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const firstName =
    user?.profile?.first_name && user.profile.first_name.toLowerCase() !== "admin"
      ? user.profile.first_name
      : "Aziz";
  const fullName =
    user?.profile?.first_name && user.profile.first_name.toLowerCase() !== "admin"
      ? `${user.profile.first_name} ${user.profile.last_name || "Benallou"}`.trim()
      : user?.name &&
        user.name.toLowerCase() !== "admin" &&
        user.name.toLowerCase() !== "administrator"
      ? user.name
      : "Aziz Benallou";
  const initials = firstName.charAt(0).toUpperCase();
  const avatarUrl =
    user?.profile?.avatar_url ||
    user?.profile?.avatar ||
    (typeof window !== "undefined"
      ? localStorage.getItem("admin_avatar_url")
      : null);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  // Auto-expand group if current path is inside it
  useEffect(() => {
    if (
      pathname.startsWith("/admin/activities") ||
      pathname.startsWith("/admin/activity-categories")
    ) {
      setOpenGroups((prev) => ({ ...prev, activities: true }));
    }
    if (
      pathname.startsWith("/admin/domains") ||
      pathname.startsWith("/admin/sub-domains") ||
      pathname.startsWith("/admin/skills")
    ) {
      setOpenGroups((prev) => ({ ...prev, catalog: true }));
    }
    if (
      pathname.startsWith("/admin/roles") ||
      pathname.startsWith("/admin/permissions") ||
      pathname.startsWith("/admin/languages")
    ) {
      setOpenGroups((prev) => ({ ...prev, system: true }));
    }
  }, [pathname]);

  const navSections: NavSection[] = [
    {
      label: t("admin.sectionMain", { defaultValue: "MAIN" }),
      items: [
        {
          to: "/admin",
          label: t("sidebar.dashboard", { defaultValue: "Dashboard" }),
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      label: t("admin.sectionManagement", { defaultValue: "MANAGEMENT" }),
      items: [
        {
          to: "/admin/users",
          label: t("admin.usersTitle", { defaultValue: "Users" }),
          icon: Users,
        },
        {
          to: "/admin/requests",
          label: t("admin.requestsTitle", { defaultValue: "Registration Requests" }),
          icon: ClipboardCheck,
          badge: pendingDemandsCount > 0 ? pendingDemandsCount : null,
          badgeVariant: "warning",
        },
        {
          to: "/admin/projects",
          label: t("admin.projectsTitle", { defaultValue: "Submitted Projects" }),
          icon: FolderKanban,
          badge: pendingProjectsCount > 0 ? pendingProjectsCount : null,
          badgeVariant: "danger",
        },
        {
          to: "/admin/organizations",
          label: t("admin.organizationsTitle", { defaultValue: "Organizations" }),
          icon: Building2,
        },
      ],
    },
    {
      label: t("admin.sectionActivities", { defaultValue: "ACTIVITIES & EVENTS" }),
      items: [
        {
          id: "activities",
          label: t("admin.activitiesNav", { defaultValue: "Activities" }),
          icon: Calendar,
          badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : null,
          items: [
            {
              to: "/admin/activities",
              label: t("admin.activitiesTitle", { defaultValue: "All Activities" }),
              icon: Calendar,
              badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : null,
              badgeVariant: "warning",
            },
            {
              to: "/admin/activity-categories",
              label: t("admin.activityCategoriesTitle", { defaultValue: "Categories" }),
              icon: Layers,
            },
          ],
        },
      ],
    },
    {
      label: t("admin.sectionCatalog", { defaultValue: "CATALOG & CONTENT" }),
      items: [
        {
          id: "catalog",
          label: t("admin.catalogNav", { defaultValue: "Catalog" }),
          icon: LayoutGrid,
          items: [
            {
              to: "/admin/domains",
              label: t("admin.domainsTitle", { defaultValue: "Domains" }),
              icon: LayoutGrid,
            },
            {
              to: "/admin/sub-domains",
              label: t("admin.subDomainsTitle", { defaultValue: "Sub-Domains" }),
              icon: Network,
            },
            {
              to: "/admin/skills",
              label: t("admin.skillsTitle", { defaultValue: "Skills" }),
              icon: BookOpen,
            },
          ],
        },
      ],
    },
    {
      label: t("admin.sectionSystem", { defaultValue: "SYSTEM & ACCESS" }),
      items: [
        {
          id: "system",
          label: t("admin.systemNav", { defaultValue: "System" }),
          icon: ShieldCheck,
          items: [
            {
              to: "/admin/roles",
              label: t("admin.rolesTitle", { defaultValue: "System Roles" }),
              icon: ShieldCheck,
            },
            {
              to: "/admin/permissions",
              label: t("admin.permissionsTitle", { defaultValue: "Permissions" }),
              icon: Key,
            },
            {
              to: "/admin/languages",
              label: t("admin.languagesTitle", { defaultValue: "Languages" }),
              icon: Globe,
            },
          ],
        },
      ],
    },
    {
      label: t("admin.sectionSettings", { defaultValue: "SETTINGS & ACCOUNT" }),
      items: [
        {
          to: "/admin/settings",
          label: t("admin.settingsTitle", { defaultValue: "Settings & Security" }),
          icon: Settings,
        },
        {
          to: "/admin/profile",
          label: t("admin.profileTitle", { defaultValue: "Admin Profile" }),
          icon: UserCheck,
        },
      ],
    },
  ];

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case "danger":
        return "bg-[#DC3545] text-white";
      case "warning":
        return "bg-[#FFC107] text-[#212529]";
      case "success":
        return "bg-[#28A745] text-white";
      case "purple":
        return "bg-[#7135E8] text-white";
      case "primary":
      default:
        return "bg-[#0D6EFD] text-white";
    }
  };

  return (
    <div
      className={cn(
        "admin-shell min-h-screen bg-[#F4F6F9] text-[#212529] font-sans",
        collapsed && "admin-sidebar-collapsed",
        mobileOpen && "admin-mobile-open",
      )}
    >
      <AdminQuickSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* ── Fixed Vertical Sidebar (AdminLTE 4 Dark Purple) ────── */}
      <aside className="admin-sidebar fixed inset-y-0 start-0 z-[1001] flex flex-col overflow-hidden bg-[#26183D] text-[#c2c7d0] shadow-lg transition-all duration-300 w-[250px]">
        {/* Brand Link / Header */}
        <div className="admin-brand flex h-14 shrink-0 items-center justify-between border-b border-[#382451] px-4 bg-[#211435]">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 overflow-hidden text-white no-underline transition-opacity hover:opacity-90"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7135E8] font-bold text-base text-white shadow-sm">
              J
            </span>
            <div className="admin-brand-text flex flex-col leading-none">
              <span className="font-extrabold tracking-wider text-base text-white">
                JADARA
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#ADB5BD] uppercase mt-0.5">
                AdminLTE 4
              </span>
            </div>
          </Link>
        </div>

        {/* User Mini Profile in Sidebar */}
        <Link
          to="/admin/profile"
          className="admin-sidebar-user border-b border-[#382451] p-3.5 flex items-center gap-3 transition-colors hover:bg-[#382451]/50 no-underline"
          title="View Admin Profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#7135E8]"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7135E8] text-sm font-bold text-white shadow-inner">
              {initials}
            </div>
          )}
          <div className="admin-sidebar-user-info min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[#28A745] animate-pulse" />
              <span className="text-[11px] font-medium text-[#ADB5BD]">
                Online • Admin
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="admin-menu flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="admin-menu-section mb-3">
              {section.label && (
                <div className="admin-menu-section-title px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                  {section.label}
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item, iIdx) => {
                  if (isNavGroup(item)) {
                    const isOpen = !!openGroups[item.id];
                    const isGroupActive = item.items.some(
                      (sub) => pathname === sub.to,
                    );

                    return (
                      <div key={item.id} className="admin-menu-group">
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                            isGroupActive && "text-white font-semibold",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <item.icon className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                            <span className="admin-nav-label truncate">
                              {item.label}
                            </span>
                          </div>
                          <div className="admin-nav-tools flex items-center gap-1.5">
                            {item.badge && (
                              <span className="rounded-full bg-[#FFC107] px-1.5 py-0.2 text-[10px] font-bold text-[#212529]">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 text-[#ADB5BD] transition-transform duration-200 rtl:rotate-180",
                                isOpen && "rotate-90 rtl:rotate-90",
                              )}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="admin-sub-menu mt-1 space-y-1 ps-6 pe-1">
                            {item.items.map((sub) => {
                              const isActive = pathname === sub.to;
                              return (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  className={cn(
                                    "flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors text-[#ADB5BD] hover:bg-[#382451] hover:text-white",
                                    isActive &&
                                      "bg-[#7135E8] text-white font-bold shadow-sm",
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <sub.icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {sub.badge && (
                                    <span
                                      className={cn(
                                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                                        getBadgeClass(sub.badgeVariant),
                                      )}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = item.exact
                    ? pathname === item.to
                    : pathname.startsWith(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                        isActive &&
                          "bg-[#7135E8] text-white font-semibold shadow-sm",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="admin-nav-label truncate">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "admin-nav-badge rounded-full px-2 py-0.5 text-[10px] font-bold",
                            getBadgeClass(item.badgeVariant),
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-foot border-t border-[#382451] p-3 text-center">
          <span className="admin-sidebar-version text-[11px] font-semibold text-[#ADB5BD]/60 uppercase tracking-widest">
            v4.0.0 Pro • Enterprise
          </span>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("common.close", { defaultValue: "Close" })}
          className="admin-sidebar-backdrop fixed inset-0 z-[1000] bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main Content Area ──────────────────────────────────── */}
      <div
        className={cn(
          "admin-body flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:ms-[64px]" : "lg:ms-[250px]",
        )}
      >
        {/* ── Top Navigation Bar (White, Clean, AdminLTE 4) ──────── */}
        <header className="admin-navbar sticky top-0 z-[999] flex h-14 items-center justify-between border-b border-[#E9ECEF] bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Start: Toggle Button & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#6C757D] transition-colors hover:bg-[#F4F6F9] hover:text-[#212529]"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Breadcrumb Navigation */}
            <nav
              className="admin-breadcrumb hidden sm:flex items-center gap-2 text-sm text-[#6C757D]"
              aria-label="Breadcrumb"
            >
              <Link
                to="/admin"
                className="flex items-center gap-1.5 font-medium hover:text-[#0D6EFD] transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Admin</span>
              </Link>
              <span className="text-[#ADB5BD]">/</span>
              <span className="font-semibold text-[#212529] truncate max-w-[200px] md:max-w-none">
                {title}
              </span>
            </nav>
          </div>

          {/* End: Search, Notifications, Messages, Fullscreen, Language, Avatar */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-md border border-[#E9ECEF] bg-[#F8F9FA] px-2.5 text-xs text-[#6C757D] transition-colors hover:border-[#ADB5BD] hover:bg-white"
              title="Search (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="hidden lg:inline rounded border border-[#DEE2E6] bg-white px-1 py-0.5 text-[10px] font-mono font-bold text-[#6C757D]">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#6C757D] transition-colors hover:bg-[#F4F6F9] hover:text-[#212529]"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-1.5 end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFC107] px-1 text-[10px] font-extrabold text-[#212529] shadow-xs">
                      {totalNotifications}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border-[#E9ECEF]">
                <div className="flex items-center justify-between border-b border-[#E9ECEF] bg-[#F8F9FA] px-4 py-2.5">
                  <span className="text-xs font-bold text-[#212529] uppercase tracking-wider">
                    {totalNotifications} Notifications
                  </span>
                  <Link
                    to="/admin/requests"
                    className="text-xs font-semibold text-[#0D6EFD] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="max-h-72 divide-y divide-[#E9ECEF] overflow-y-auto">
                  {pendingDemandsCount > 0 && (
                    <Link
                      to="/admin/requests"
                      className="flex items-start gap-3 p-3 transition-colors hover:bg-[#F8F9FA]"
                    >
                      <ClipboardCheck className="h-5 w-5 shrink-0 text-[#FFC107] mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#212529]">
                          {pendingDemandsCount} Registration Requests
                        </p>
                        <p className="text-[11px] text-[#6C757D]">
                          New partner & reviewer applications waiting
                        </p>
                      </div>
                    </Link>
                  )}

                  {pendingProjectsCount > 0 && (
                    <Link
                      to="/admin/projects"
                      className="flex items-start gap-3 p-3 transition-colors hover:bg-[#F8F9FA]"
                    >
                      <FolderKanban className="h-5 w-5 shrink-0 text-[#DC3545] mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#212529]">
                          {pendingProjectsCount} Submitted Projects
                        </p>
                        <p className="text-[11px] text-[#6C757D]">
                          Projects submitted for review
                        </p>
                      </div>
                    </Link>
                  )}

                  {pendingActivitiesCount > 0 && (
                    <Link
                      to="/admin/activities"
                      className="flex items-start gap-3 p-3 transition-colors hover:bg-[#F8F9FA]"
                    >
                      <Calendar className="h-5 w-5 shrink-0 text-[#0D6EFD] mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#212529]">
                          {pendingActivitiesCount} Pending Activities
                        </p>
                        <p className="text-[11px] text-[#6C757D]">
                          Activities awaiting validation
                        </p>
                      </div>
                    </Link>
                  )}

                  {totalNotifications === 0 && (
                    <div className="p-6 text-center text-xs text-[#6C757D]">
                      Everything is up to date! No pending alerts.
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E9ECEF] p-2 text-center bg-[#F8F9FA]">
                  <Link
                    to="/admin"
                    className="text-xs font-semibold text-[#0D6EFD] hover:underline"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md text-[#6C757D] transition-colors hover:bg-[#F4F6F9] hover:text-[#212529]"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>

            {/* Settings Button */}
            <Link
              to="/admin/settings"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md text-[#6C757D] transition-colors hover:bg-[#F4F6F9] hover:text-[#7135E8]"
              title={t("admin.settingsTitle", { defaultValue: "Settings & Security" })}
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Language Switcher */}
            <div className="admin-language">
              <LanguageSwitcher />
            </div>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-[#F4F6F9]"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-[#DEE2E6]"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0D6EFD] text-xs font-bold text-white shadow-xs">
                      {initials}
                    </span>
                  )}
                  <span className="hidden md:inline text-xs font-bold text-[#212529]">
                    {firstName}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#6C757D]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border-[#E9ECEF]">
                <DropdownMenuLabel className="p-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#212529]">
                      {fullName}
                    </span>
                    <span className="text-[11px] text-[#6C757D]">
                      {user?.email}
                    </span>
                    <span className="mt-1 inline-flex w-fit items-center rounded-sm bg-[#7135E8] px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
                      ADMINISTRATOR
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="cursor-pointer gap-2 text-xs font-semibold">
                    <User className="h-3.5 w-3.5 text-[#7135E8]" />
                    {t("admin.profile", { defaultValue: "Admin Profile" })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="cursor-pointer gap-2 text-xs font-semibold">
                    <Settings className="h-3.5 w-3.5 text-[#0D6EFD]" />
                    {t("admin.settingsTitle", { defaultValue: "Settings & Security" })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer gap-2 text-xs font-medium">
                    <LayoutDashboard className="h-3.5 w-3.5 text-[#0D6EFD]" />
                    {t("sidebar.dashboard", { defaultValue: "Dashboard" })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/users" className="cursor-pointer gap-2 text-xs font-medium">
                    <Users className="h-3.5 w-3.5 text-[#28A745]" />
                    {t("admin.usersTitle", { defaultValue: "Manage Users" })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer gap-2 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-[#6C757D]" />
                    {t("common.backToHome", { defaultValue: "Public Website" })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-xs font-medium text-[#DC3545] focus:text-[#DC3545]"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5 rtl:rotate-180" />
                  {t("nav.logout", { defaultValue: "Sign Out" })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page Main Content Area ─────────────────────────────── */}
        <main className="admin-content flex-1 p-4 md:p-6 lg:p-7 max-w-7xl w-full mx-auto">
          {(subtitle || actions) && (
            <div className="admin-page-header mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-[#212529] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-xs md:text-sm text-[#6C757D]">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="admin-page-actions flex items-center gap-2 shrink-0">
                  {actions}
                </div>
              )}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
