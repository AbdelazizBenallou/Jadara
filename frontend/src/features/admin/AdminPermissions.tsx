import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Key,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  createPermission,
  deletePermission,
  listPermissions,
  updatePermission,
} from "@/api/roles";
import type { Permission } from "@/types/role";

export function AdminPermissions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Permission | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: listPermissions,
  });

  const createMut = useMutation({
    mutationFn: () => createPermission({ name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      setName("");
      notifySuccess(t("common.success", { defaultValue: "Permission created successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updatePermission(editing!.id, { name: editing!.name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      setEditing(null);
      notifySuccess(t("common.success", { defaultValue: "Permission updated successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      notifySuccess(t("common.success", { defaultValue: "Permission deleted successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const filteredPermissions = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q),
    );
  }, [data, search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMut.mutate();
  };

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.permissionsTitle", { defaultValue: "Permissions Management" })}
      subtitle={t("admin.permissionsSubtitle", {
        defaultValue: "Define fine-grained privileges and system action access rules",
      })}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Left Column: Add New Permission Form (4 cols) ──── */}
          <div className="lg:col-span-4">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#7135E8]" />
                  <span>{t("admin.addPermission", { defaultValue: "New Permission" })}</span>
                </div>
              }
              subtitle="Register a new permission rule"
            >
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.permissionName", { defaultValue: "Permission Key / Name" })}
                  </label>
                  <div className="relative">
                    <Key className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#7135E8]" />
                    <Input
                      placeholder="e.g. users.create, projects.verify"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#7135E8] text-sm"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#6C757D]">
                    Use standard lowercase dot notation (e.g. <code>entity.action</code>).
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!name.trim() || createMut.isPending}
                  className="w-full bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2"
                >
                  {createMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{t("common.add", { defaultValue: "Create Permission" })}</span>
                </Button>
              </form>
            </AdminCard>
          </div>

          {/* ── Right Column: Permissions Table & Filter (8 cols) ── */}
          <div className="lg:col-span-8">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#0D6EFD]" />
                  <span>{t("admin.permissions", { defaultValue: "Registered Permissions" })}</span>
                  <span className="rounded-full bg-[#0D6EFD] px-2 py-0.5 text-[11px] font-bold text-white ms-1">
                    {data.length}
                  </span>
                </div>
              }
              subtitle="All system privileges available for role assignment"
              collapsible
              maximizable
              headerActions={
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute top-1/2 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#6C757D]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search permissions..."
                    className="h-8 pl-8 rtl:pr-8 rtl:pl-2 text-xs bg-white border-[#E9ECEF]"
                  />
                </div>
              }
              bodyClassName="p-0 overflow-x-auto"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="w-16">{t("common.id", { defaultValue: "ID" })}</th>
                    <th>{t("common.name", { defaultValue: "Permission Key" })}</th>
                    <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0D6EFD]" />
                      </td>
                    </tr>
                  ) : filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="admin-table-empty">
                        {t("admin.noPermissions", { defaultValue: "No permissions found." })}
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((perm) => (
                      <tr key={perm.id}>
                        <td className="font-mono text-xs text-[#6C757D] font-bold">
                          #{perm.id}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            {/* Crisp icon without light background */}
                            <Key className="h-4 w-4 shrink-0 text-[#7135E8]" />
                            <code className="rounded bg-[#F8F9FA] border border-[#E9ECEF] px-2 py-0.5 font-mono text-xs font-semibold text-[#212529]">
                              {perm.name}
                            </code>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(perm)}
                              className="h-8 border-[#DEE2E6] text-xs font-semibold hover:border-[#0D6EFD] hover:text-[#0D6EFD] gap-1"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t("common.edit", { defaultValue: "Edit" })}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  confirm(
                                    t("common.confirmDelete", {
                                      defaultValue: `Are you sure you want to delete permission "${perm.name}"?`,
                                    }),
                                  )
                                ) {
                                  deleteMut.mutate(perm.id);
                                }
                              }}
                              disabled={deleteMut.isPending}
                              className="h-8 text-[#DC3545] hover:bg-[#DC3545] hover:text-white transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </AdminCard>
          </div>
        </div>

        {/* ── Edit Modal ───────────────────────────────────────── */}
        {editing && (
          <div
            className="admin-modal-backdrop"
            onClick={() => setEditing(null)}
          >
            <div
              className="admin-modal max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-head">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#7135E8]" />
                  <h3>{t("common.edit", { defaultValue: "Edit Permission" })}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="admin-modal-body space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.permissionName", { defaultValue: "Permission Key" })}
                  </label>
                  <div className="relative">
                    <Key className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#7135E8]" />
                    <Input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#7135E8]"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-foot">
                <Button
                  variant="outline"
                  onClick={() => setEditing(null)}
                  className="border-[#DEE2E6]"
                >
                  {t("common.cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button
                  onClick={() => updateMut.mutate()}
                  disabled={!editing.name.trim() || updateMut.isPending}
                  className="bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] gap-1.5"
                >
                  {updateMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{t("common.save", { defaultValue: "Save Changes" })}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
