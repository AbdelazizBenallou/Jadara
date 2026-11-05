import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Users,
  Shield,
  Search,
  Loader2,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listRoles } from "@/api/roles";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Input } from "@/components/ui/input";

export function AdminRoles() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: listRoles,
  });

  const roleMeta: Record<
    string,
    {
      icon: typeof ShieldCheck;
      color: string;
      level: string;
      badgeBg: string;
      description: string;
    }
  > = {
    admin: {
      icon: ShieldCheck,
      color: "text-[#7135E8]",
      level: "Full Administrator",
      badgeBg: "bg-[#7135E8] text-white",
      description: "Complete authority over platform users, projects, system settings, and catalogs.",
    },
    reviewer: {
      icon: UserCheck,
      color: "text-[#0D6EFD]",
      level: "Domain Evaluator",
      badgeBg: "bg-[#0D6EFD] text-white",
      description: "Assigned to review and endorse submitted projects and verify beneficiary achievements.",
    },
    company: {
      icon: Building2,
      color: "text-[#28A745]",
      level: "Partner / Enterprise",
      badgeBg: "bg-[#28A745] text-white",
      description: "Can post volunteering activities, search verified talent pools, and partner with beneficiaries.",
    },
    beneficiary: {
      icon: Users,
      color: "text-[#FFC107]",
      level: "Talent / Candidate",
      badgeBg: "bg-[#FFC107] text-[#212529]",
      description: "Standard registered user with access to portfolios, CV builder, and opportunity search.",
    },
  };

  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        String(r.id).includes(q) ||
        (roleMeta[r.name.toLowerCase()]?.description || "").toLowerCase().includes(q),
    );
  }, [roles, search]);

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.rolesTitle", { defaultValue: "System Roles" })}
      subtitle={t("admin.rolesSubtitle", {
        defaultValue: "Inspect access control tiers, permissions, and security roles",
      })}
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchRoles", {
                defaultValue: "Search roles by name, ID or description...",
              })}
              className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6C757D]">
              Total Roles: <strong className="text-[#212529]">{roles.length}</strong>
            </span>
          </div>
        </div>

        {/* Roles Table inside AdminCard */}
        <AdminCard
          title={
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#7135E8]" />
              <span>{t("admin.rolesList", { defaultValue: "System Security Roles" })}</span>
            </div>
          }
          subtitle="Defined role-based access control (RBAC) tiers"
          collapsible
          maximizable
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="w-16">{t("common.id", { defaultValue: "ID" })}</th>
                <th>{t("common.role", { defaultValue: "Role" })}</th>
                <th>{t("admin.accessTier", { defaultValue: "Access Tier" })}</th>
                <th>{t("common.description", { defaultValue: "Description" })}</th>
                <th className="text-end">{t("common.status", { defaultValue: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0D6EFD]" />
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    {t("admin.noRolesFound", { defaultValue: "No roles matching your search." })}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const meta = roleMeta[role.name.toLowerCase()] || {
                    icon: Shield,
                    color: "text-[#6C757D]",
                    level: "Standard Role",
                    badgeBg: "bg-[#6C757D] text-white",
                    description: "Standard system-defined access level.",
                  };
                  const IconComp = meta.icon;

                  return (
                    <tr key={role.id}>
                      <td className="font-mono text-xs text-[#6C757D] font-bold">
                        #{role.id}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {/* Crisp icon without light background */}
                          <IconComp className={`h-5 w-5 shrink-0 ${meta.color}`} />
                          <span className="font-bold capitalize text-[#212529]">
                            {role.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${meta.badgeBg}`}
                        >
                          {meta.level}
                        </span>
                      </td>
                      <td className="max-w-md text-xs text-[#6C757D] leading-relaxed">
                        {meta.description}
                      </td>
                      <td className="text-end">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#28A745]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </AdminCard>
      </div>
    </DashboardLayout>
  );
}
