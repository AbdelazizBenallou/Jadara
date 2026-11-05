import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Network,
  LayoutGrid,
  Filter,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSubDomain,
  deleteSubDomain,
  listAllSubDomains,
  listDomains,
  updateSubDomain,
} from "@/api/domains";
import { getErrorMessage } from "@/lib/notify";
import { queryKeys } from "@/lib/query-keys";
import type { Domain, SubDomain } from "@/types/domain";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminStatBox } from "@/components/admin/AdminStatBox";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { Modal } from "@/components/ui/Modal";

export function AdminSubDomains() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | null>(null);
  const [formDomainId, setFormDomainId] = useState<string>("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Fetch all primary domains for dropdown selector & mapping
  const { data: domains = [], isLoading: loadingDomains } = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });

  // Fetch all sub-domains
  const { data: subDomains = [], isLoading: loadingSubDomains } = useQuery({
    queryKey: queryKeys.domains.allSubDomains(),
    queryFn: () => listAllSubDomains(),
  });

  // Mapping domain id -> domain object
  const domainMap = useMemo(() => {
    const map = new Map<number, Domain>();
    domains.forEach((d) => map.set(d.id, d));
    return map;
  }, [domains]);

  // Filtered sub-domains list
  const filteredSubDomains = useMemo(() => {
    return subDomains.filter((sd) => {
      // Domain filter
      if (selectedDomainFilter !== "all") {
        if (String(sd.domain_id) !== selectedDomainFilter) return false;
      }
      // Search text
      if (search.trim()) {
        const query = search.toLowerCase();
        const parentName = (sd.domain?.name || domainMap.get(sd.domain_id || 0)?.name || "").toLowerCase();
        const nameMatch = sd.name.toLowerCase().includes(query);
        const descMatch = (sd.description || "").toLowerCase().includes(query);
        const domainMatch = parentName.includes(query);
        return nameMatch || descMatch || domainMatch;
      }
      return true;
    });
  }, [subDomains, selectedDomainFilter, search, domainMap]);

  // Create Sub-domain mutation
  const createMutation = useMutation({
    mutationFn: (data: { domain_id: number; name: string; description?: string }) =>
      createSubDomain(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.allSubDomains() });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.subDomainAdded", { defaultValue: "Sub-domain created successfully" }));
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.subDomainAddError"));
    },
  });

  // Update Sub-domain mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; domain_id: number; name: string; description?: string }) =>
      updateSubDomain(data.id, {
        domain_id: data.domain_id,
        name: data.name,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.allSubDomains() });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.subDomainUpdated", { defaultValue: "Sub-domain updated successfully" }));
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.subDomainUpdateError"));
    },
  });

  // Delete Sub-domain mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSubDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.allSubDomains() });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.subDomainDeleted", { defaultValue: "Sub-domain removed successfully" }));
      setIsDeleteModalOpen(false);
      setSelectedSubDomain(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.subDomainDeleteError"));
    },
  });

  const resetForm = () => {
    setSelectedSubDomain(null);
    setFormDomainId(domains.length > 0 ? String(domains[0].id) : "");
    setFormName("");
    setFormDescription("");
  };

  const openAddModal = () => {
    resetForm();
    if (selectedDomainFilter !== "all") {
      setFormDomainId(selectedDomainFilter);
    } else if (domains.length > 0) {
      setFormDomainId(String(domains[0].id));
    }
    setIsAddModalOpen(true);
  };

  const openEditModal = (sd: SubDomain) => {
    setSelectedSubDomain(sd);
    setFormDomainId(String(sd.domain_id || sd.domain?.id || (domains[0]?.id ?? "")));
    setFormName(sd.name);
    setFormDescription(sd.description || "");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (sd: SubDomain) => {
    setSelectedSubDomain(sd);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDomainId) {
      toast.error("Please fill in sub-domain name and select a parent domain");
      return;
    }
    createMutation.mutate({
      domain_id: Number(formDomainId),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubDomain) return;
    if (!formName.trim() || !formDomainId) {
      toast.error("Please fill in sub-domain name and select a parent domain");
      return;
    }
    updateMutation.mutate({
      id: selectedSubDomain.id,
      domain_id: Number(formDomainId),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    });
  };

  const handleDeleteSubmit = () => {
    if (!selectedSubDomain) return;
    deleteMutation.mutate(selectedSubDomain.id);
  };

  const isLoading = loadingDomains || loadingSubDomains;

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.subDomainsTitle", { defaultValue: "Sub-Domains" })}
      subtitle={t("admin.subDomainsSubtitle", {
        defaultValue: "Manage sub-domain classifications nested under each primary domain category",
      })}
    >
      <div className="space-y-6">
        {/* ── Section 1: Top KPI Statistic Boxes ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatBox
            variant="purple"
            value={subDomains.length}
            title={t("admin.totalSubDomains", { defaultValue: "Total Sub-Domains" })}
            icon={Network}
            moreInfoText={t("common.viewAll", { defaultValue: "View Catalog" })}
            moreInfoHref="/admin/domains"
          />
          <AdminStatBox
            variant="blue"
            value={domains.length}
            title={t("admin.parentDomains", { defaultValue: "Primary Domains" })}
            icon={LayoutGrid}
            moreInfoText={t("admin.manageDomains", { defaultValue: "Manage Primary Domains" })}
            moreInfoHref="/admin/domains"
          />
          <AdminStatBox
            variant="green"
            value={filteredSubDomains.length}
            title={t("admin.activeSubDomains", { defaultValue: "Filtered Results" })}
            icon={CheckCircle2}
          />
        </div>

        {/* ── Section 2: Search, Domain Filter & Create Bar ─────── */}
        <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C757D]" />
                <input
                  type="text"
                  placeholder={t("admin.searchSubDomains", {
                    defaultValue: "Search by sub-domain name, description, or domain...",
                  })}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#DEE2E6] bg-white py-2 ps-9 pe-3 text-sm text-[#212529] placeholder-[#ADB5BD] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
                />
              </div>

              {/* Domain Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#6C757D] shrink-0" />
                <select
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                  className="rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm font-medium text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
                >
                  <option value="all">
                    {t("admin.allDomains", { defaultValue: "All Primary Domains" })} ({domains.length})
                  </option>
                  {domains.map((dom) => (
                    <option key={dom.id} value={String(dom.id)}>
                      {dom.name}
                    </option>
                  ))}
                </select>

                {(search || selectedDomainFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setSelectedDomainFilter("all");
                    }}
                    className="text-xs font-semibold text-[#DC3545] hover:bg-transparent hover:underline"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* "+ Add Sub-Domain" Action Button */}
            <Button
              onClick={openAddModal}
              className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{t("admin.addSubDomain", { defaultValue: "New Sub-Domain" })}</span>
            </Button>
          </div>
        </div>

        {/* ── Section 3: Sub-Domains Table ───────────────────────── */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-[#E9ECEF] bg-white shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#7135E8]" />
          </div>
        ) : filteredSubDomains.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-[#E9ECEF] bg-white p-6 text-center shadow-sm">
            <Network className="mb-3 h-12 w-12 text-[#ADB5BD]" />
            <h4 className="text-base font-bold text-[#212529]">
              {t("common.noResults", { defaultValue: "No sub-domains found" })}
            </h4>
            <p className="mt-1 text-xs text-[#6C757D] max-w-sm">
              {search || selectedDomainFilter !== "all"
                ? "Try adjusting your search criteria or domain filter."
                : "Get started by adding your first sub-domain under any existing primary domain."}
            </p>
            <Button
              onClick={openAddModal}
              className="mt-4 bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Sub-Domain</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="border-b border-[#E9ECEF] bg-[#F8F9FA] text-[11px] font-bold uppercase tracking-wider text-[#6C757D]">
                  <tr>
                    <th className="px-5 py-3 w-16">ID</th>
                    <th className="px-5 py-3">Sub-Domain Name</th>
                    <th className="px-5 py-3">Primary Domain</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right rtl:text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {filteredSubDomains.map((subDomain) => {
                    const parent =
                      subDomain.domain || domainMap.get(subDomain.domain_id || 0);

                    return (
                      <tr
                        key={subDomain.id}
                        className="transition-colors hover:bg-[#F8F9FA]/70"
                      >
                        {/* ID */}
                        <td className="px-5 py-3.5 font-mono text-xs text-[#6C757D]">
                          #{subDomain.id}
                        </td>

                        {/* Sub-Domain Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Network className="h-4 w-4 text-[#7135E8] shrink-0" />
                            <span className="font-bold text-[#212529]">
                              {subDomain.name}
                            </span>
                          </div>
                        </td>

                        {/* Parent Domain */}
                        <td className="px-5 py-3.5">
                          {parent ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F6F9] border border-[#DEE2E6] px-2.5 py-1 text-xs font-semibold text-[#26183D]">
                              <LayoutGrid className="h-3 w-3 text-[#0D6EFD]" />
                              <span>{parent.name}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#ADB5BD]">—</span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="px-5 py-3.5 text-xs text-[#6C757D] max-w-md">
                          <p className="line-clamp-2">
                            {subDomain.description || (
                              <span className="italic text-[#ADB5BD]">
                                No description provided
                              </span>
                            )}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right rtl:text-left">
                          <div className="flex items-center justify-end rtl:justify-start gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(subDomain)}
                              title={t("common.edit", { defaultValue: "Edit" })}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#7135E8] transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(subDomain)}
                              title={t("common.delete", { defaultValue: "Delete" })}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#DC3545] transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="border-t border-[#E9ECEF] bg-[#F8F9FA] px-5 py-2.5 flex items-center justify-between text-xs text-[#6C757D]">
              <span>
                Showing <strong>{filteredSubDomains.length}</strong> of{" "}
                <strong>{subDomains.length}</strong> sub-domains
              </span>
              <span>
                Covering <strong>{domains.length}</strong> primary domains
              </span>
            </div>
          </div>
        )}

        {/* ── Add Sub-Domain Modal ───────────────────────────────── */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => !createMutation.isPending && setIsAddModalOpen(false)}
          title={t("admin.addSubDomain", { defaultValue: "Create New Sub-Domain" })}
        >
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#212529] uppercase tracking-wider">
                Primary Domain *
              </label>
              <select
                required
                value={formDomainId}
                onChange={(e) => setFormDomainId(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
              >
                <option value="" disabled>
                  Select a primary domain
                </option>
                {domains.map((dom) => (
                  <option key={dom.id} value={String(dom.id)}>
                    {dom.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#212529] uppercase tracking-wider">
                Sub-Domain Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Frontend Development, Machine Learning, UI/UX..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#212529] uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Describe the scope or competencies covered by this sub-domain..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E9ECEF]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={createMutation.isPending}
                className="border-[#DEE2E6] text-[#212529]"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold"
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                )}
                {t("common.save", { defaultValue: "Create Sub-Domain" })}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Edit Sub-Domain Modal ──────────────────────────────── */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => !updateMutation.isPending && setIsEditModalOpen(false)}
          title={t("admin.editSubDomain", { defaultValue: "Edit Sub-Domain" })}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#212529] uppercase tracking-wider">
                Primary Domain *
              </label>
              <select
                required
                value={formDomainId}
                onChange={(e) => setFormDomainId(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
              >
                {domains.map((dom) => (
                  <option key={dom.id} value={String(dom.id)}>
                    {dom.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#212529] uppercase tracking-wider">
                Sub-Domain Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#212529] uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E9ECEF]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={updateMutation.isPending}
                className="border-[#DEE2E6] text-[#212529]"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                )}
                {t("common.save", { defaultValue: "Save Changes" })}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Delete Confirmation Modal ──────────────────────────── */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !deleteMutation.isPending && setIsDeleteModalOpen(false)}
          title={t("admin.deleteSubDomain", { defaultValue: "Delete Sub-Domain" })}
        >
          <div className="space-y-4">
            <p className="text-sm text-[#6C757D]">
              Are you sure you want to delete the sub-domain{" "}
              <strong className="text-[#212529]">"{selectedSubDomain?.name}"</strong>?
              Associated skills or projects may need to be updated.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#E9ECEF]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
                className="border-[#DEE2E6] text-[#212529]"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteMutation.isPending}
                className="bg-[#DC3545] text-white hover:bg-[#bd2130] font-semibold"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                )}
                {t("common.delete", { defaultValue: "Delete" })}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
