import { useMemo } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Sparkles,
  Settings,
  ClipboardCheck,
  LogOut,
  FolderOpen,
  FileText,
  HeartHandshake,
  Globe,
  Compass,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/constants/roles";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number | string | null;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

function useNav(role: Role): NavSection[] {
  const { t } = useTranslation();

  if (role === "beneficiary") {
    return [
      {
        label: t("admin.sectionMain", { defaultValue: "MAIN" }),
        items: [
          {
            to: "/dashboard",
            label: t("sidebar.dashboard", { defaultValue: "Dashboard" }),
            icon: LayoutDashboard,
            exact: true,
          },
          {
            to: "/",
            label: t("sidebar.communityFeed", { defaultValue: "Community Feed" }),
            icon: Globe,
            exact: true,
          },
        ],
      },
      {
        label: t("sidebar.volunteeringSection", {
          defaultValue: "VOLUNTEERING & JOURNEY",
        }),
        items: [
          {
            to: "/dashboard/applications",
            label: t("sidebar.applications", {
              defaultValue: "My Applications",
            }),
            icon: HeartHandshake,
          },
          {
            to: "/",
            label: t("sidebar.exploreActivities", {
              defaultValue: "Explore Activities",
            }),
            icon: Compass,
          },
        ],
      },
      {
        label: t("sidebar.portfolioSection", {
          defaultValue: "PROFILE & PORTFOLIO",
        }),
        items: [
          {
            to: "/dashboard/profile",
            label: t("sidebar.profile", { defaultValue: "My Profile" }),
            icon: User,
          },
          {
            to: "/dashboard/skills",
            label: t("sidebar.skills", { defaultValue: "Skills & Domains" }),
            icon: Sparkles,
          },
          {
            to: "/dashboard/projects",
            label: t("exp.projects", { defaultValue: "Projects & Evidence" }),
            icon: FolderOpen,
          },
          {
            to: "/dashboard/cv-builder",
            label: t("cv.title", { defaultValue: "CV Builder" }),
            icon: FileText,
          },
        ],
      },
    ];
  }

  if (role === "reviewer") {
    return [
      {
        label: t("reviewer.sidebar.review", {
          defaultValue: "REVIEW & EVALUATION",
        }),
        items: [
          {
            to: "/reviewer",
            label: t("reviewer.sidebar.dashboard", {
              defaultValue: "Dashboard",
            }),
            icon: LayoutDashboard,
            exact: true,
          },
          {
            to: "/reviewer/queue",
            label: t("reviewer.sidebar.verificationQueue", {
              defaultValue: "Verification Queue",
            }),
            icon: ClipboardCheck,
          },
        ],
      },
    ];
  }

  return [];
}

export function Sidebar({
  role,
  className,
  onCloseMobile,
}: {
  role: Role;
  className?: string;
  onCloseMobile?: () => void;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });
  const sections = useNav(role);

  // Clean and deduplicate user name
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

  const roleLabel =
    role === "beneficiary"
      ? "Beneficiary"
      : role === "reviewer"
      ? "Reviewer"
      : role === "organization"
      ? "Organization"
      : role;

  return (
    <aside
      className={cn(
        "flex w-[250px] shrink-0 flex-col overflow-hidden bg-[#26183D] text-[#c2c7d0] shadow-lg border-e border-[#382451]",
        className,
      )}
    >
      {/* ── Brand Header (Matches AdminLTE 4 Dark Header) ───── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#382451] px-4 bg-[#211435]">
        <Link
          to={role === "beneficiary" ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 overflow-hidden text-white no-underline transition-opacity hover:opacity-90"
          onClick={onCloseMobile}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7135E8] font-bold text-base text-white shadow-sm">
            J
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-wider text-base text-white">
              JADARA
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-[#ADB5BD] uppercase mt-0.5">
              {roleLabel} Portal
            </span>
          </div>
        </Link>
      </div>

      {/* ── User Mini Profile in Sidebar (Matches Admin Sidebar) ── */}
      <Link
        to="/dashboard/profile"
        onClick={onCloseMobile}
        className="border-b border-[#382451] p-3.5 flex items-center gap-3 transition-colors hover:bg-[#382451]/50 no-underline"
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
          <p className="truncate text-xs font-bold text-white">{cleanFullName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#28A745] animate-pulse" />
            <span className="text-[11px] font-medium text-[#ADB5BD]">
              Online • {roleLabel}
            </span>
          </div>
        </div>
      </Link>

      {/* ── Navigation Menu ─────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.label && (
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#ADB5BD]/60 uppercase">
                {section.label}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);

                return (
                  <Link
                    key={`${item.to}-${item.label}`}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 text-[#c2c7d0] hover:bg-[#382451] hover:text-white",
                      isActive &&
                        "bg-[#7135E8] text-white font-bold shadow-sm hover:bg-[#7135E8]",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-white" : "text-[#ADB5BD]",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-[#7135E8] px-1.5 py-0.2 text-[10px] font-bold text-white">
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

      {/* ── Footer / Quick Actions ──────────────────────────── */}
      <div className="border-t border-[#382451] bg-[#211435] p-3 space-y-1">
        {role !== "reviewer" && (
          <Link
            to="/dashboard/settings"
            onClick={onCloseMobile}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-[#c2c7d0] transition-colors hover:bg-[#382451] hover:text-white"
          >
            <Settings className="h-4 w-4 text-[#ADB5BD]" />
            <span>{t("sidebar.settings", { defaultValue: "Settings" })}</span>
          </Link>
        )}

        <button
          type="button"
          onClick={async () => {
            if (onCloseMobile) onCloseMobile();
            await logout();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-[#DC3545] transition-colors hover:bg-[#DC3545]/15"
        >
          <LogOut className="h-4 w-4 rtl:rotate-180" />
          <span>{t("nav.logout", { defaultValue: "Logout" })}</span>
        </button>
      </div>
    </aside>
  );
}
