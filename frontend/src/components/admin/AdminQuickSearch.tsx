import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Building2,
  Calendar,
  ClipboardCheck,
  FolderKanban,
  Globe,
  Key,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

interface AdminQuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminQuickSearch({ isOpen, onClose }: AdminQuickSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    {
      to: "/admin",
      label: t("sidebar.dashboard", { defaultValue: "Dashboard" }),
      section: "Main",
      icon: LayoutDashboard,
      iconColor: "text-[#0D6EFD]",
    },
    {
      to: "/admin/profile",
      label: t("admin.profile", { defaultValue: "Admin Profile" }),
      section: "Main",
      icon: ShieldCheck,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/users",
      label: t("admin.usersTitle", { defaultValue: "Users" }),
      section: "Management",
      icon: Users,
      iconColor: "text-[#0D6EFD]",
    },
    {
      to: "/admin/requests",
      label: t("admin.requestsTitle", { defaultValue: "Registration Requests" }),
      section: "Management",
      icon: ClipboardCheck,
      iconColor: "text-[#FFC107]",
    },
    {
      to: "/admin/projects",
      label: t("admin.projectsTitle", { defaultValue: "Submitted Projects" }),
      section: "Management",
      icon: FolderKanban,
      iconColor: "text-[#DC3545]",
    },
    {
      to: "/admin/organizations",
      label: t("admin.organizationsTitle", { defaultValue: "Organizations" }),
      section: "Management",
      icon: Building2,
      iconColor: "text-[#28A745]",
    },
    {
      to: "/admin/activities",
      label: t("admin.activitiesTitle", { defaultValue: "Activities & Events" }),
      section: "Activities",
      icon: Calendar,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/activity-categories",
      label: t("admin.activityCategoriesTitle", { defaultValue: "Activity Categories" }),
      section: "Activities",
      icon: Layers,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/domains",
      label: t("admin.domainsTitle", { defaultValue: "Catalog Domains" }),
      section: "Catalog",
      icon: LayoutGrid,
      iconColor: "text-[#0D6EFD]",
    },
    {
      to: "/admin/sub-domains",
      label: t("admin.subDomainsTitle", { defaultValue: "Sub-Domains" }),
      section: "Catalog",
      icon: Network,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/skills",
      label: t("admin.skillsTitle", { defaultValue: "Catalog Skills" }),
      section: "Catalog",
      icon: BookOpen,
      iconColor: "text-[#0D6EFD]",
    },
    {
      to: "/admin/settings",
      label: t("admin.settingsTitle", { defaultValue: "Settings & Security" }),
      section: "System",
      icon: Settings,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/roles",
      label: t("admin.rolesTitle", { defaultValue: "System Roles" }),
      section: "System",
      icon: ShieldCheck,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/permissions",
      label: t("admin.permissionsTitle", { defaultValue: "Permissions" }),
      section: "System",
      icon: Key,
      iconColor: "text-[#7135E8]",
    },
    {
      to: "/admin/languages",
      label: t("admin.languagesTitle", { defaultValue: "System Languages" }),
      section: "System",
      icon: Globe,
      iconColor: "text-[#7135E8]",
    },
  ];

  const filtered = quickLinks.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.section.toLowerCase().includes(query.toLowerCase()) ||
      item.to.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (to: string) => {
    navigate({ to });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-sm sm:pt-28"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-[#E9ECEF] text-[#212529]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-[#E9ECEF] px-4 py-3">
          <Search className="h-5 w-5 text-[#6C757D] me-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.searchPlaceholder", {
              defaultValue: "Type a command or search pages...",
            })}
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#ADB5BD]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#6C757D]">
              {t("common.noResults", { defaultValue: "No matching pages found" })}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => handleSelect(item.to)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#F4F6F9]"
                >
                  <div className="flex items-center gap-3">
                    {/* Clean icon without light background wrapper */}
                    <item.icon className={`h-4 w-4 shrink-0 ${item.iconColor}`} />
                    <span className="font-medium text-[#212529]">
                      {item.label}
                    </span>
                  </div>
                  <span className="rounded bg-[#F4F6F9] px-2 py-0.5 text-[11px] font-semibold text-[#6C757D] uppercase tracking-wider">
                    {item.section}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#E9ECEF] bg-[#F8F9FA] px-4 py-2 text-xs text-[#6C757D]">
          <span>Navigation Quick Finder</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[#DEE2E6] bg-white px-1.5 py-0.5 font-mono text-[10px]">
              ESC
            </kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
