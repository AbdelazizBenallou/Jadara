import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Check,
  X,
  Languages,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  createLanguage,
  deleteLanguage,
  listLanguages,
  updateLanguage,
} from "@/api/languages";
import type { Language } from "@/types/cv";

export function AdminLanguages() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Language | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => listLanguages({ limit: 100 }),
  });

  const createMut = useMutation({
    mutationFn: () => createLanguage({ name: name.trim(), code: code.trim().toLowerCase() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "languages"] });
      setName("");
      setCode("");
      notifySuccess(t("common.success", { defaultValue: "Language added successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateLanguage(editing!.id, {
        name: editing!.name.trim(),
        code: ((editing as any).code || "").trim().toLowerCase() || null,
        status: (editing as any).status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "languages"] });
      setEditing(null);
      notifySuccess(t("common.success", { defaultValue: "Language updated successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteLanguage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "languages"] });
      notifySuccess(t("common.success", { defaultValue: "Language deleted successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const filteredLanguages = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        ((lang as any).code || "").toLowerCase().includes(q),
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
      title={t("admin.languagesTitle", { defaultValue: "Languages" })}
      subtitle={t("admin.languagesSubtitle", {
        defaultValue: "Manage supported platform interface and candidate CV languages",
      })}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Left Column: Add Language Form (4 cols) ────────── */}
          <div className="lg:col-span-4">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-[#0D6EFD]" />
                  <span>{t("admin.addLanguage", { defaultValue: "Add Language" })}</span>
                </div>
              }
              subtitle="Register a new language option"
            >
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.languageName", { defaultValue: "Language Name" })}
                  </label>
                  <div className="relative">
                    <Globe className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#0D6EFD]" />
                    <Input
                      placeholder="e.g. English, Arabic, French"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.languageCode", { defaultValue: "Language Code (ISO)" })}
                  </label>
                  <Input
                    placeholder="e.g. en, ar, fr, es"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={5}
                    className="bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD] text-sm font-mono uppercase"
                  />
                  <p className="mt-1 text-[11px] text-[#6C757D]">
                    2-letter ISO 639-1 code recommended.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!name.trim() || createMut.isPending}
                  className="w-full bg-[#0D6EFD] text-white hover:bg-[#0b5ed7] font-semibold gap-2"
                >
                  {createMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{t("common.add", { defaultValue: "Register Language" })}</span>
                </Button>
              </form>
            </AdminCard>
          </div>

          {/* ── Right Column: Languages Table (8 cols) ─────────── */}
          <div className="lg:col-span-8">
            <AdminCard
              title={
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#0D6EFD]" />
                  <span>{t("admin.languages", { defaultValue: "Languages List" })}</span>
                  <span className="rounded-full bg-[#0D6EFD] px-2 py-0.5 text-[11px] font-bold text-white ms-1">
                    {data.length}
                  </span>
                </div>
              }
              subtitle="All registered languages available across forms and CVs"
              collapsible
              maximizable
              headerActions={
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute top-1/2 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#6C757D]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="h-8 pl-8 rtl:pr-8 rtl:pl-2 text-xs bg-white border-[#E9ECEF]"
                  />
                </div>
              }
              bodyClassName="p-0 overflow-x-auto"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>{t("admin.name", { defaultValue: "Language" })}</th>
                    <th>{t("admin.code", { defaultValue: "ISO Code" })}</th>
                    <th>{t("common.status", { defaultValue: "Status" })}</th>
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
                  ) : filteredLanguages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-table-empty">
                        {t("admin.noLanguages", { defaultValue: "No languages found." })}
                      </td>
                    </tr>
                  ) : (
                    filteredLanguages.map((lang) => (
                      <tr key={lang.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            {/* Crisp icon without light background */}
                            <Globe className="h-4 w-4 shrink-0 text-[#0D6EFD]" />
                            <span className="font-bold text-[#212529]">
                              {lang.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="rounded bg-[#F8F9FA] border border-[#DEE2E6] px-2 py-0.5 font-mono text-xs font-bold text-[#212529] uppercase">
                            {(lang as any).code || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#28A745]">
                            <Check className="h-3.5 w-3.5" />
                            <span>Active</span>
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(lang)}
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
                                      defaultValue: `Delete language "${lang.name}"?`,
                                    }),
                                  )
                                ) {
                                  deleteMut.mutate(lang.id);
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
                  <Globe className="h-4 w-4 text-[#0D6EFD]" />
                  <h3>{t("common.edit", { defaultValue: "Edit Language" })}</h3>
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
                    {t("admin.name", { defaultValue: "Language Name" })}
                  </label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    className="bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#212529] mb-1.5">
                    {t("admin.code", { defaultValue: "Language Code (ISO)" })}
                  </label>
                  <Input
                    value={(editing as any).code || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        code: e.target.value,
                      } as any)
                    }
                    maxLength={5}
                    className="bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD] font-mono uppercase"
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
