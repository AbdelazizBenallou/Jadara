import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Edit2, Trash2, Eye, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { Modal } from "@/components/ui/Modal";

interface Domain {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function AdminDomains() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const {
    data: domains = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-domains"],
    queryFn: async () => {
      const res = await apiClient.get("/domains?limit=100");
      const data = res.data?.data?.data || res.data?.data || [];
      return Array.isArray(data) ? (data as Domain[]) : [];
    },
  });

  const { data: domainDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["domain-details", selectedDomain?.id],
    queryFn: async () => {
      if (!selectedDomain) return null;
      const [skillsRes, revRes] = await Promise.all([
        apiClient.get(`/domains/${selectedDomain.id}/skills`),
        apiClient.get(`/domains/${selectedDomain.id}/reviewers`),
      ]);
      return {
        skills: skillsRes.data?.data || [],
        reviewers: revRes.data?.data || [],
      };
    },
    enabled: isViewModalOpen && !!selectedDomain,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      await apiClient.post("/domains", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
      toast.success(t("admin.domainAdded", { defaultValue: "Domain created successfully" }));
      setIsAddModalOpen(false);
      setFormData({ name: "", description: "" });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr.response?.data?.message ||
          t("admin.domainAddError", { defaultValue: "Failed to create domain" }),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string }) => {
      await apiClient.patch(`/domains/${data.id}`, {
        name: data.name,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
      toast.success(t("admin.domainUpdated", { defaultValue: "Domain updated successfully" }));
      setIsEditModalOpen(false);
      setSelectedDomain(null);
      setFormData({ name: "", description: "" });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr.response?.data?.message ||
          t("admin.domainUpdateError", { defaultValue: "Failed to update domain" }),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
      toast.success(t("admin.domainDeleted", { defaultValue: "Domain deleted successfully" }));
      setIsDeleteModalOpen(false);
      setSelectedDomain(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409 || axiosErr.response?.status === 400) {
        toast.error(
          axiosErr.response?.data?.message ||
            t("admin.cannotDeleteDomain", {
              defaultValue:
                "Cannot delete Domain: It is currently assigned to active skills or reviewers.",
            }),
        );
      } else {
        toast.error(
          axiosErr.response?.data?.message ||
            t("admin.domainDeleteError", { defaultValue: "Failed to delete domain" }),
        );
      }
    },
  });

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
          <div className="flex w-full sm:max-w-md items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("common.search", { defaultValue: "Search..." })}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={() => {
              setFormData({ name: "", description: "" });
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t("admin.addDomain", { defaultValue: "Add Domain" })}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border bg-card text-muted-foreground">
            <LayoutGrid className="mb-4 h-12 w-12 opacity-20" />
            <p>{t("common.error", { defaultValue: "An error occurred." })}</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border bg-card text-muted-foreground">
            <LayoutGrid className="mb-4 h-12 w-12 opacity-20" />
            <p>{t("common.noResults", { defaultValue: "No domains found." })}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      {t("common.title", { defaultValue: "Title" })}
                    </th>
                    <th className="px-6 py-4 font-medium">
                      {t("common.date", { defaultValue: "Date" })}
                    </th>
                    <th className="px-6 py-4 font-medium text-right rtl:text-left">
                      {t("common.actions", { defaultValue: "Actions" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {domains.map((domain) => (
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
                        {formatDate(domain.created_at, i18n.language)}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openViewModal(domain)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(domain)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(domain)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
      >
        {loadingDetails ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
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
                  {domainDetails!.reviewers.map(
                    (r: {
                      id: number;
                      email: string;
                      name?: string;
                      profile?: { first_name?: string; last_name?: string };
                    }) => (
                      <li key={r.id} className="text-sm">
                        {r.profile?.first_name || r.profile?.last_name
                          ? `${r.profile.first_name || ""} ${r.profile.last_name || ""}`
                          : r.name || "Unnamed"}{" "}
                        - {r.email}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
