import { useMemo } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Compass,
  Building2,
  Bookmark,
  HeartHandshake,
  FileText,
  Sparkles,
  User,
  PlusCircle,
  CalendarDays,
  Users,
  CheckSquare,
  Clock,
  Award,
  Briefcase,
  Search,
  FolderKanban,
  LogOut,
  Building,
  Layers,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface SocialSidebarProps {
  onCreateActivityClick?: () => void;
  className?: string;
}

export function SocialSidebar({
  onCreateActivityClick,
  className,
}: SocialSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const role = user?.role?.toLowerCase() || "beneficiary";

  // Clean deduplicated full name
  const cleanFullName = useMemo(() => {
    const f = (user?.profile?.first_name || "").trim();
    const l = (user?.profile?.last_name || "").trim();
    if (f && l) {
      if (f.toLowerCase() === l.toLowerCase()) return f;
      if (f.toLowerCase().includes(l.toLowerCase())) return f;
      if (l.toLowerCase().includes(f.toLowerCase())) return l;
      return `${f} ${l}`;
    }
    return f || l || user?.name || user?.email?.split("@")[0] || "User";
  }, [user]);

  const initials = useMemo(() => {
    const parts = cleanFullName.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return cleanFullName.charAt(0).toUpperCase() || "J";
  }, [cleanFullName]);

  const avatarUrl = user?.profile?.avatar_url;

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      className={cn(
        "flex flex-col justify-between h-[calc(100vh-2rem)] sticky top-4 rounded-2xl bg-[#26183D] border border-[#382451] shadow-xl overflow-hidden",
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* ── Brand Logo Header (Admin Dashboard Style) ─── */}
        <div className="border-b border-[#382451] px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 no-underline transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7135E8] text-white font-black text-lg shadow-sm">
              J
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold tracking-wider text-base text-white">
                JADARA
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#ADB5BD] uppercase mt-0.5">
                Volunteering Hub
              </span>
            </div>
          </Link>
        </div>

        {/* ── User Mini Profile in Sidebar (Admin Dashboard Style) ─── */}
        <Link
          to={role === "admin" ? "/admin/profile" : "/dashboard/profile"}
          className="border-b border-[#382451] p-3.5 flex items-center gap-3 transition-colors hover:bg-[#382451]/50 no-underline group"
          title="View Profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={cleanFullName}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#7135E8]"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7135E8] text-sm font-bold text-white shadow-inner">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white group-hover:text-[#7135E8] transition-colors">
              {cleanFullName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[#28A745] animate-pulse" />
              <span className="text-[11px] font-medium text-[#ADB5BD] capitalize">
                Online • {role}
              </span>
            </div>
          </div>
        </Link>

        {/* ── Navigation Links ─────────────────────────────── */}
        <div className="p-3 space-y-5">
          {/* Section: Discover */}
          <div>
            <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
              Discover
            </div>
            <nav className="space-y-1 mt-1 text-xs">
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive("/")
                    ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                    : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                )}
              >
                <Compass className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                <span className="truncate">Community Feed</span>
              </Link>

              <Link
                to="/organizations"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive("/organizations")
                    ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                    : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                )}
              >
                <Building2 className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                <span className="truncate">Organizations</span>
              </Link>

              <Link
                to="/saved"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive("/saved")
                    ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                    : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                )}
              >
                <Bookmark className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                <span className="truncate">Saved Missions</span>
              </Link>
            </nav>
          </div>

          {/* Section: Beneficiary Navigation */}
          {role === "beneficiary" && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                My Journey
              </div>
              <nav className="space-y-1 mt-1 text-xs">
                <Link
                  to="/dashboard/applications"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/dashboard/applications")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">My Applications</span>
                </Link>

                <Link
                  to="/dashboard/skills"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/dashboard/skills")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">My Skills</span>
                </Link>

                <Link
                  to="/dashboard/cv-builder"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/dashboard/cv-builder")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <Layers className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">CV Builder</span>
                </Link>

                <Link
                  to="/dashboard/profile"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/dashboard/profile")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <User className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">My Profile</span>
                </Link>
              </nav>
            </div>
          )}

          {/* Section: Organization Navigation */}
          {role === "organization" && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                My Organization
              </div>
              <nav className="space-y-1 mt-1 text-xs">
                {onCreateActivityClick && (
                  <button
                    type="button"
                    onClick={onCreateActivityClick}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#c2c7d0] hover:bg-[#382451] hover:text-white transition-all duration-200"
                  >
                    <PlusCircle className="h-4 w-4 shrink-0 text-[#7135E8]" />
                    <span className="truncate">Post Mission</span>
                  </button>
                )}

                <Link
                  to="/dashboard/profile"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/dashboard/profile")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <Building className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">Organization Profile</span>
                </Link>
              </nav>
            </div>
          )}

          {/* Section: Reviewer Navigation */}
          {role === "reviewer" && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                Evaluation Queue
              </div>
              <nav className="space-y-1 mt-1 text-xs">
                <Link
                  to="/reviewer/queue"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/reviewer/queue")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <CheckSquare className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">Review Queue</span>
                </Link>

                <Link
                  to="/reviewer/domains"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/reviewer/domains")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">Assigned Domains</span>
                </Link>
              </nav>
            </div>
          )}

          {/* Section: Company Navigation */}
          {role === "company" && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                Talent & Recruiting
              </div>
              <nav className="space-y-1 mt-1 text-xs">
                <Link
                  to="/company"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive("/company")
                      ? "bg-[#7135E8] text-white font-semibold shadow-sm"
                      : "text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                  )}
                >
                  <Search className="h-4 w-4 shrink-0 text-[#ADB5BD]" />
                  <span className="truncate">Talent Discovery</span>
                </Link>
              </nav>
            </div>
          )}

          {/* Section: Admin Shortcut */}
          {role === "admin" && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                Administration
              </div>
              <nav className="space-y-1 mt-1 text-xs">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#c2c7d0] hover:bg-[#382451] hover:text-white transition-all duration-200"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-[#7135E8]" />
                  <span className="truncate">Admin Control Panel</span>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: Logout Bar (Admin Dashboard Theme) ──── */}
      <div className="border-t border-[#382451] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[#ADB5BD] hover:bg-[#382451] hover:text-[#DC3545] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="h-4 w-4 text-[#DC3545]" />
            <span>Sign Out</span>
          </div>
          <span className="text-[10px] text-[#ADB5BD]/60 font-mono">v1.0</span>
        </button>
      </div>
    </aside>
  );
}
