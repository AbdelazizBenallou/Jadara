import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Sparkles,
  Settings,
  ClipboardCheck,
  Users,
  ShieldCheck,
  LogOut,
  FolderOpen,
  FileText,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Role } from "@/constants/roles";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
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
        items: [
          {
            to: "/dashboard",
            label: t("sidebar.dashboard"),
            icon: LayoutDashboard,
            exact: true,
          },
          {
            to: "/dashboard/profile",
            label: t("sidebar.profile"),
            icon: User,
          },
          {
            to: "/dashboard/skills",
            label: t("sidebar.skills"),
            icon: Sparkles,
          },
          {
            to: "/dashboard/projects",
            label: t("exp.projects", {
              defaultValue: "Projects",
            }),
            icon: FolderOpen,
          },
          {
            to: "/dashboard/cv-builder",
            label: t("cv.title", {
              defaultValue: "CV Builder",
            }),
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
        defaultValue: "REVIEW",
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

  if (role === "admin") {
    return [
      {
        items: [
          {
            to: "/admin",
            label: t("sidebar.dashboard", {
              defaultValue: "Dashboard",
            }),
            icon: LayoutDashboard,
            exact: true,
          },
        ],
      },
      {
        label: t("admin.manage", {
          defaultValue: "Manage",
        }),
        items: [
          {
            to: "/admin/users",
            label: t("admin.usersTitle", {
              defaultValue: "Users",
            }),
            icon: Users,
          },
          {
            to: "/admin/requests",
            label: t("admin.requestsTitle", {
              defaultValue: "Registration Requests",
            }),
            icon: ClipboardCheck,
          },
          {
            to: "/admin/projects",
            label: t("admin.projectsTitle", {
              defaultValue: "Projects",
            }),
            icon: FolderOpen,
          },
        ],
      },
      {
        label: t("admin.catalog", {
          defaultValue: "Catalog",
        }),
        items: [
          {
            to: "/admin/domains",
            label: t("admin.domainsTitle", {
              defaultValue: "Domains",
            }),
            icon: LayoutGrid,
          },
          {
            to: "/admin/skills",
            label: t("admin.skillsTitle", {
              defaultValue: "Skills",
            }),
            icon: BookOpen,
          },
        ],
      },
      {
        label: t("admin.system", {
          defaultValue: "System",
        }),
        items: [
          {
            to: "/admin/roles",
            label: t("admin.rolesTitle", {
              defaultValue: "System Roles",
            }),
            icon: ShieldCheck,
          },
        ],
      },
    ];
  }

  return [];
}

function SideLink({ item }: { item: NavItem }) {
  return (
    <Link
      to={item.to}
      activeOptions={{
        exact: item.exact ?? false,
      }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      activeProps={{
        className:
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold bg-sidebar-accent text-sidebar-accent-foreground",
      }}
    >
      <item.icon className="h-4.5 w-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const sections = useNav(role);

  const firstName =
    user?.profile?.first_name ||
    user?.name ||
    "J";

  const fullName = user?.profile?.first_name
    ? `${user.profile.first_name} ${
        user.profile.last_name || ""
      }`.trim()
    : user?.name || "JADARA";

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-5"
      >
        {language === "ar" ? (
          <img
            src="/images/logo_ar.png"
            alt="جدارة"
            className="h-8"
          />
        ) : (
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            JADARA
          </span>
        )}
      </Link>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2">
        <nav className="space-y-4 px-3 pb-4">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="space-y-1"
            >
              {section.label && (
                <div className="px-3 pb-2 pt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </div>
              )}

              {section.items.map(
                (item) => (
                  <SideLink
                    key={`${item.to}-${item.label}`}
                    item={item}
                  />
                ),
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border bg-sidebar p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {fullName}
            </p>

            <p className="truncate text-xs capitalize text-muted-foreground">
              {t(`roles.${role}`)}
            </p>
          </div>
        </div>

        {role !== "reviewer" && (
          <Link
            to="/dashboard/settings"
            className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold bg-sidebar-accent text-sidebar-accent-foreground",
            }}
          >
            <Settings className="h-4 w-4" />

            {t("sidebar.settings", {
              defaultValue: "Settings",
            })}
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 rtl:rotate-180" />

          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
