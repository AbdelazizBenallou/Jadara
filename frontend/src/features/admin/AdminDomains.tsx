import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Loader2, Plus, Edit2, Trash2, Eye, LayoutGrid, Network, Search } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDomain,
  createSubDomain,
  deleteDomain,
  deleteSubDomain,
  getDomainReviewers,
  getDomainSkills,
  getSubDomains,
  listDomains,
  updateDomain,
  updateSubDomain,
} from "@/api/domains";
import { getErrorMessage } from "@/lib/notify";
import { queryKeys } from "@/lib/query-keys";
import type { Domain } from "@/types/domain";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { Modal } from "@/components/ui/Modal";

export function AdminDomains() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [subDomainForm, setSubDomainForm] = useState({ name: "", description: "" });
  const [editingSubDomainId, setEditingSubDomainId] = useState<number | null>(null);

  const { data: domains = [], isLoading } = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });

  const filteredDomains = useMemo(() => {
    if (!search.trim()) return domains;
    const q = search.toLowerCase();
    return domains.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)),
    );
  }, [domains, search]);

  const { data: domainDetails, isLoading: loadingDetails } = useQuery({
    queryKey: queryKeys.domains.detail(selectedDomain?.id ?? "none"),
    queryFn: async () => {
      if (!selectedDomain) return null;
      const [skills, reviewers] = await Promise.all([
        getDomainSkills(selectedDomain.id),
        getDomainReviewers(selectedDomain.id),
      ]);
      return { skills, reviewers: reviewers.reviewers };
    },
    enabled: isViewModalOpen && !!selectedDomain,
  });

  const { data: subDomains = [], isLoading: loadingSubDomains } = useQuery({
    queryKey: queryKeys.domains.subDomains(selectedDomain?.id ?? "none"),
    queryFn: () => getSubDomains(selectedDomain!.id),
    enabled: isViewModalOpen && !!selectedDomain,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      createDomain(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.domainAdded", { defaultValue: "Domain created successfully" }));
      setIsAddModalOpen(false);
      setFormData({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.domainAddError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description: string }) =>
      updateDomain(data.id, {
        name: data.name,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.domainUpdated", { defaultValue: "Domain updated successfully" }));
      setIsEditModalOpen(false);
      setSelectedDomain(null);
      setFormData({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.domainUpdateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.domainDeleted", { defaultValue: "Domain deleted successfully" }));
      setIsDeleteModalOpen(false);
      setSelectedDomain(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.domainDeleteError"));
    },
  });

  const saveSubDomainMutation = useMutation({
    mutationFn: (payload: { id?: number; name: string; description: string }) => {
      if (payload.id) {
        return updateSubDomain(payload.id, {
          name: payload.name,
          description: payload.description || "",
        });
      }
      if (!selectedDomain) throw new Error("No domain selected");
      return createSubDomain({
        name: payload.name,
        description: payload.description || undefined,
        domain_id: selectedDomain.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.subDomains(selectedDomain?.id ?? "none"),
      });
      toast.success(t("admin.subDomainSaved", { defaultValue: "Sub-domain saved successfully" }));
      setSubDomainForm({ name: "", description: "" });
      setEditingSubDomainId(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.subDomainSaveError"));
    },
  });

  const deleteSubDomainMutation = useMutation({
    mutationFn: (id: number) => deleteSubDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.subDomains(selectedDomain?.id ?? "none"),
      });
      toast.success(
        t("admin.subDomainDeleted", { defaultValue: "Sub-domain deleted successfully" }),
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.subDomainDeleteError"));
    },
  });

  const handleSubDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subDomainForm.name.trim()) return;
    saveSubDomainMutation.mutate({
      id: editingSubDomainId ?? undefined,
      name: subDomainForm.name,
      description: subDomainForm.description,
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;
    updateMutation.mutate({ id: selectedDomain.id, ...formData });
  };

  const handleDelete = () => {
    if (!selectedDomain) return;
    deleteMutation.mutate(selectedDomain.id);
  };

  const openViewModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setSubDomainForm({ name: "", description: "" });
    setEditingSubDomainId(null);
    setIsViewModalOpen(true);
  };

  const openEditModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setFormData({ name: domain.name, description: domain.description || "" });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.domainsTitle", { defaultValue: "Domains" })}
      subtitle={t("admin.domainsSubtitle", {
        defaultValue: "Manage the skill domains available on JADARA.",
      })}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex w-full sm:max-w-md items-center gap-2 rounded-xl border border-[#DEE2E6] bg-white px-3 py-2 shadow-sm focus-within:border-[#7135E8] focus-within:ring-1 focus-within:ring-[#7135E8]">
            <Search className="h-4 w-4 text-[#6C757D]" />
            <input
              type="text"
              placeholder={t("admin.searchDomains", { defaultValue: "Search domains by title or description..." })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[#212529] outline-none placeholder-[#ADB5BD]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-[#DC3545] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Link to="/admin/sub-domains">
              <Button
                variant="outline"
                className="border-[#DEE2E6] text-[#212529] hover:bg-[#F8F9FA] font-semibold gap-1.5 shadow-xs"
              >
                <Network className="h-4 w-4 text-[#7135E8]" />
                <span>{t("admin.subDomainsTitle", { defaultValue: "Sub-Domains" })}</span>
              </Button>
            </Link>
            <Button
              onClick={() => {
                setFormData({ name: "", description: "" });
                setIsAddModalOpen(true);
              }}
              className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{t("admin.addDomain", { defaultValue: "Add Domain" })}</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-[#E9ECEF] bg-white shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#7135E8]" />
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-[#E9ECEF] bg-white text-[#6C757D] shadow-sm">
            <LayoutGrid className="mb-4 h-12 w-12 text-[#ADB5BD]" />
            <p>{t("common.noResults", { defaultValue: "No domains found." })}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="border-b border-[#E9ECEF] bg-[#F8F9FA] text-[11px] font-bold uppercase tracking-wider text-[#6C757D]">
                  <tr>
                    <th className="px-6 py-3 font-bold">
                      {t("common.title", { defaultValue: "Title" })}
                    </th>
                    <th className="px-6 py-3 font-bold">
                      {t("common.date", { defaultValue: "Date" })}
                    </th>
                    <th className="px-6 py-3 font-bold text-right rtl:text-left">
                      {t("common.actions", { defaultValue: "Actions" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {filteredDomains.map((domain) => (
                    <tr key={domain.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{domain.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-xs">
                            {domain.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {domain.created_at ? formatDate(domain.created_at, i18n.language) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(domain)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#0D6EFD] transition-colors"
                            title={t("common.view", { defaultValue: "View" })}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(domain)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#7135E8] transition-colors"
                            title={t("common.edit", { defaultValue: "Edit" })}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(domain)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#DC3545] transition-colors"
                            title={t("common.delete", { defaultValue: "Delete" })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !createMutation.isPending && setIsAddModalOpen(false)}
        title={t("admin.addDomain", { defaultValue: "Add Domain" })}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("common.title", { defaultValue: "Title" })}
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("common.description", { defaultValue: "Description" })}
            </label>
            <textarea
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={createMutation.isPending}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !updateMutation.isPending && setIsEditModalOpen(false)}
        title={t("common.edit", { defaultValue: "Edit" })}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("common.title", { defaultValue: "Title" })}
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("common.description", { defaultValue: "Description" })}
            </label>
            <textarea
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteMutation.isPending && setIsDeleteModalOpen(false)}
        title={t("common.confirm", { defaultValue: "Are you sure?" })}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("admin.deleteDomainWarning", {
              defaultValue:
                "Are you sure you want to delete this domain? This action cannot be undone.",
            })}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {t("common.delete", { defaultValue: "Delete" })}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedDomain?.name || ""}
        size="lg"
      >
        {loadingDetails ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("common.description", { defaultValue: "Description" })}
              </h3>
              <p className="mt-1 text-sm">{selectedDomain?.description || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("admin.skillsTitle", { defaultValue: "Skills" })} (
                {domainDetails?.skills?.length || 0})
              </h3>
              {(domainDetails?.skills?.length || 0) > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {domainDetails!.skills.map((s: { id: number; name: string }) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">-</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("admin.activeReviewers", { defaultValue: "Reviewers" })} (
                {domainDetails?.reviewers?.length || 0})
              </h3>
              {(domainDetails?.reviewers?.length || 0) > 0 ? (
                <ul className="mt-2 space-y-1">
                  {domainDetails!.reviewers.map((r) => (
                      <li key={r.id} className="text-sm">
                        {r.profile?.first_name || r.profile?.last_name
                          ? `${r.profile.first_name || ""} ${r.profile.last_name || ""}`
                          : "Unnamed"}{" "}
                        - {r.email}
                      </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">-</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("admin.subDomainsTitle", { defaultValue: "Sub-domains" })}
              </h3>
              {loadingSubDomains ? (
                <div className="mt-2 flex h-12 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : subDomains.length > 0 ? (
                <ul className="mt-2 divide-y divide-border rounded-xl border">
                  {subDomains.map(
                    (sd: { id: number; name: string; description?: string | null }) => (
                      <li key={sd.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{sd.name}</p>
                          {sd.description ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {sd.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSubDomainId(sd.id);
                              setSubDomainForm({
                                name: sd.name,
                                description: sd.description || "",
                              });
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#DC3545] hover:bg-[#F4F6F9] hover:text-[#bd2130]"
                            onClick={() => deleteSubDomainMutation.mutate(sd.id)}
                            disabled={deleteSubDomainMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">-</p>
              )}

              <form
                onSubmit={handleSubDomainSubmit}
                className="mt-3 rounded-xl border bg-muted/20 p-3"
              >
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {editingSubDomainId
                    ? t("admin.editSubDomain", { defaultValue: "Edit sub-domain" })
                    : t("admin.addSubDomain", { defaultValue: "Add sub-domain" })}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <input
                    type="text"
                    required
                    placeholder={t("common.title", { defaultValue: "Title" })}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary sm:w-1/3"
                    value={subDomainForm.name}
                    onChange={(e) => setSubDomainForm({ ...subDomainForm, name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder={t("common.description", { defaultValue: "Description" })}
                    className="w-full flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    value={subDomainForm.description}
                    onChange={(e) =>
                      setSubDomainForm({ ...subDomainForm, description: e.target.value })
                    }
                  />
                  <div className="flex shrink-0 justify-end gap-2">
                    {editingSubDomainId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSubDomainId(null);
                          setSubDomainForm({ name: "", description: "" });
                        }}
                      >
                        {t("common.cancel", { defaultValue: "Cancel" })}
                      </Button>
                    )}
                    <Button type="submit" size="sm" disabled={saveSubDomainMutation.isPending}>
                      {saveSubDomainMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                      )}
                      {editingSubDomainId
                        ? t("common.update", { defaultValue: "Update" })
                        : t("common.add", { defaultValue: "Add" })}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
