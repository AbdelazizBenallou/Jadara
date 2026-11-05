import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  createActivityCategory,
  deleteActivityCategory,
  listActivityCategories,
  updateActivityCategory,
  type ActivityCategory,
} from "@/api/activity-categories";

export function AdminActivityCategories() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ActivityCategory | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "activity-categories"],
    queryFn: listActivityCategories,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createActivityCategory({ name: name.trim(), description: description.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activity-categories"] });
      setName("");
      setDescription("");
      notifySuccess(t("common.success", { defaultValue: "Category created successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateActivityCategory(editing!.id, {
        name: editing!.name.trim(),
        description: editing!.description?.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activity-categories"] });
      setEditing(null);
      notifySuccess(t("common.success", { defaultValue: "Category updated successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteActivityCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activity-categories"] });
      notifySuccess(t("common.success", { defaultValue: "Category deleted successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const filteredCategories = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description || "").toLowerCase().includes(q),
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
      title={t("admin.activityCategoriesTitle", { defaultValue: "Activity Categories" })}
      subtitle={t("admin.activityCategoriesSubtitle", {
        defaultValue: "Organize volunteering activities, workshops, and training events into categories",
      })}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Left Column: Add Category Form (4 cols) ────────── */}
          <div className="lg:col-span-4">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#7135E8]" />
                  <span>{t("admin.addCategory", { defaultValue: "New Category" })}</span>
                </div>
              }
              subtitle="Register a new activity classification"
            >
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.categoryName", { defaultValue: "Category Name" })}
                  </label>
                  <div className="relative">
                    <Layers className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#7135E8]" />
                    <Input
                      placeholder="e.g. Workshop, Hackathon, Mentorship"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#7135E8] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.description", { defaultValue: "Description (Optional)" })}
                  </label>
                  <Input
                    placeholder="Short summary of this activity type"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border-[#E9ECEF] focus-visible:border-[#7135E8] text-sm"
                  />
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
                  <span>{t("common.add", { defaultValue: "Add Category" })}</span>
                </Button>
              </form>
            </AdminCard>
          </div>

          {/* ── Right Column: Categories List & Filter (8 cols) ── */}
          <div className="lg:col-span-8">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#0D6EFD]" />
                  <span>{t("admin.categories", { defaultValue: "Activity Categories" })}</span>
                  <span className="rounded-full bg-[#0D6EFD] px-2 py-0.5 text-[11px] font-bold text-white ms-1">
                    {data.length}
                  </span>
                </div>
              }
              subtitle="All defined categories for activities classification"
              collapsible
              maximizable
              headerActions={
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute top-1/2 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#6C757D]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
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
                    <th>{t("admin.name", { defaultValue: "Category" })}</th>
                    <th>{t("admin.description", { defaultValue: "Description" })}</th>
                    <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0D6EFD]" />
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-table-empty">
                        {t("admin.noCategories", { defaultValue: "No activity categories found." })}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="font-mono text-xs text-[#6C757D] font-bold">
                          #{cat.id}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            {/* Clean icon without light background */}
                            <Layers className="h-4 w-4 shrink-0 text-[#7135E8]" />
                            <span className="font-bold text-[#212529]">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-xs text-[#6C757D] max-w-sm">
                          {cat.description || "—"}
                        </td>
                        <td className="text-end">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(cat)}
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
                                      defaultValue: `Delete category "${cat.name}"?`,
                                    }),
                                  )
                                ) {
                                  deleteMut.mutate(cat.id);
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
                  <Layers className="h-4 w-4 text-[#7135E8]" />
                  <h3>{t("common.edit", { defaultValue: "Edit Category" })}</h3>
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
                    {t("admin.name", { defaultValue: "Category Name" })}
                  </label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    className="bg-white border-[#E9ECEF] focus-visible:border-[#7135E8]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.description", { defaultValue: "Description" })}
                  </label>
                  <Input
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    className="bg-white border-[#E9ECEF] focus-visible:border-[#7135E8]"
                  />
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
