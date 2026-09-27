import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type RoleType = {
  id: number;
  name: string;
};

export function AdminRoles() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await apiClient.get("/roles");
        setRoles(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.rolesTitle", { defaultValue: "System Roles" })}
      subtitle={t("admin.rolesSubtitle", {
        defaultValue: "View the available roles in the system.",
      })}
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    {t("common.id", { defaultValue: "ID" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.role", { defaultValue: "Role Name" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-muted-foreground">
                      {t("admin.noRolesFound", { defaultValue: "No roles found." })}
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium text-muted-foreground">{role.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <span className="font-semibold capitalize text-foreground">
                            {role.name}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
