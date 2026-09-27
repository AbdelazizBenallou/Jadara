import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

interface Skill {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface Domain {
  id: number;
  name: string;
}

export function AdminSkills() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Forms state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    domain_ids: [] as number[],
  });

  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: ["admin-domains-list"],
    queryFn: async () => {
      const res = await apiClient.get("/domains?limit=100");
      const dData = res.data?.data?.data || res.data?.data || [];
      return Array.isArray(dData) ? (dData as Domain[]) : [];
    },
  });

  const {
    data: skillsData,
    isLoading: isLoadingSkills,
    error,
  } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: async () => {
      const skillsRes = await apiClient.get("/skills?limit=1000");
      const sData = skillsRes.data?.data?.data || skillsRes.data?.data || [];
      const skills = Array.isArray(sData) ? (sData as Skill[]) : [];

      // Build Skill -> Domains map by fetching each domain's skills
      // This is exactly how the legacy component did it
      const map: Record<number, Domain[]> = {};
      const dData = queryClient.getQueryData<Domain[]>(["admin-domains-list"]) || [];

      if (Array.isArray(dData)) {
        await Promise.all(
          dData.map(async (domain) => {
            try {
              const dsRes = await apiClient.get(`/domains/${domain.id}/skills`);
              const domainSkills = dsRes.data?.data || [];
              domainSkills.forEach((ds: { id: number }) => {
                if (!map[ds.id]) map[ds.id] = [];
                map[ds.id].push(domain);
              });
            } catch (e) {
              console.error(`Failed to fetch skills for domain ${domain.id}`, e);
            }
          }),
        );
      }
      return { skills, skillDomainMap: map };
    },
    enabled: !isLoadingDomains, // Wait for domains list to be cached
  });

  const skills = skillsData?.skills || [];
  const skillDomainMap = skillsData?.skillDomainMap || {};
  const isLoading = isLoadingDomains || isLoadingSkills;

  const handleDomainToggle = (domainId: number) => {
    setFormData((prev) => ({
      ...prev,
      domain_ids: prev.domain_ids.includes(domainId)
        ? prev.domain_ids.filter((id) => id !== domainId)
        : [...prev.domain_ids, domainId],
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post("/skills", {
        name: data.name,
        description: data.description,
        status: data.status,
      });
      const newSkillId = res.data?.data?.id;

      if (newSkillId && data.domain_ids.length > 0) {
        for (const dId of data.domain_ids) {
          await apiClient.post(`/domains/${dId}/skills`, { skill_ids: [newSkillId] });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success(t("admin.skillAdded", { defaultValue: "Skill created successfully" }));
      setIsAddModalOpen(false);
      setFormData({ name: "", description: "", status: "active", domain_ids: [] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr.response?.data?.message ||
          t("admin.skillAddError", { defaultValue: "Failed to create skill" }),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      await apiClient.patch(`/skills/${data.id}`, {
        name: data.name,
        description: data.description,
        status: data.status,
      });

      // Find which domains are newly assigned and which are removed
      const oldDomains = skillDomainMap[data.id]?.map((d) => d.id) || [];
      const newDomainIds = data.domain_ids.filter((id) => !oldDomains.includes(id));
      const removedDomainIds = oldDomains.filter((id) => !data.domain_ids.includes(id));

      if (removedDomainIds.length > 0) {
        toast.warning(
          t("admin.skillRemoveDomainWarning", {
            defaultValue:
              "Backend limitation: Cannot remove existing domain relationships. Only new relationships were added.",
          }),
        );
      }

      if (newDomainIds.length > 0) {
        for (const dId of newDomainIds) {
          try {
            await apiClient.post(`/domains/${dId}/skills`, { skill_ids: [data.id] });
          } catch (e) {} // ignore if fails
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success(t("admin.skillUpdated", { defaultValue: "Skill updated successfully" }));
      setIsEditModalOpen(false);
      setSelectedSkill(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr.response?.data?.message ||
          t("admin.skillUpdateError", { defaultValue: "Failed to update skill" }),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success(t("admin.skillDeleted", { defaultValue: "Skill deleted successfully" }));
      setIsDeleteModalOpen(false);
      setSelectedSkill(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409 || axiosErr.response?.status === 400) {
        toast.error(
          axiosErr.response?.data?.message ||
            t("admin.cannotDeleteSkill", {
              defaultValue: "Cannot delete Skill: It is currently assigned to users or domains.",
            }),
        );
      } else {
        toast.error(
          axiosErr.response?.data?.message ||
            t("admin.skillDeleteError", { defaultValue: "Failed to delete skill" }),
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
    if (!selectedSkill) return;
    updateMutation.mutate({ id: selectedSkill.id, ...formData });
  };

  const handleDelete = () => {
    if (!selectedSkill) return;
    deleteMutation.mutate(selectedSkill.id);
  };

  const openEditModal = (skill: Skill) => {
    setSelectedSkill(skill);
    const existingDomains = skillDomainMap[skill.id]?.map((d) => d.id) || [];
    setFormData({
      name: skill.name,
      description: skill.description || "",
      status: skill.status || "active",
      domain_ids: existingDomains,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.skillsTitle", { defaultValue: "Skills" })}
      subtitle={t("admin.skillsSubtitle", {
        defaultValue: "Manage the skills available on JADARA.",
      })}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex w-full sm:max-w-md items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("common.search", { defaultValue: "Search..." })}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={() => {
              setFormData({ name: "", description: "", status: "active", domain_ids: [] });
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t("admin.addSkill", { defaultValue: "Add Skill" })}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border bg-card text-muted-foreground">
            <BookOpen className="mb-4 h-12 w-12 opacity-20" />
            <p>{t("common.error", { defaultValue: "An error occurred." })}</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border bg-card text-muted-foreground">
            <BookOpen className="mb-4 h-12 w-12 opacity-20" />
            <p>{t("common.noResults", { defaultValue: "No skills found." })}</p>
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
                      {t("admin.domainsTitle", { defaultValue: "Domains" })}
                    </th>
                    <th className="px-6 py-4 font-medium">
                      {t("common.status", { defaultValue: "Status" })}
                    </th>
                    <th className="px-6 py-4 font-medium text-right rtl:text-left">
                      {t("common.actions", { defaultValue: "Actions" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {skills.map((skill) => (
                    <tr key={skill.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{skill.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-xs">
                            {skill.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(skillDomainMap[skill.id] || []).map((d) => (
                            <span
                              key={d.id}
                              className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            >
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={skill.status || "active"} />
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(skill)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(skill)}
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

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !createMutation.isPending && setIsAddModalOpen(false)}
        title={t("admin.addSkill", { defaultValue: "Add Skill" })}
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
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("admin.domainsTitle", { defaultValue: "Domains" })}
            </label>
            <div className="flex flex-wrap gap-2 rounded-xl border p-3">
              {domains.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.domain_ids.includes(d.id)}
                    onChange={() => handleDomainToggle(d.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {d.name}
                </label>
              ))}
            </div>
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
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("admin.domainsTitle", { defaultValue: "Domains" })}
            </label>
            <div className="flex flex-wrap gap-2 rounded-xl border p-3">
              {domains.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.domain_ids.includes(d.id)}
                    onChange={() => handleDomainToggle(d.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {d.name}
                </label>
              ))}
            </div>
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteMutation.isPending && setIsDeleteModalOpen(false)}
        title={t("common.confirm", { defaultValue: "Are you sure?" })}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("admin.deleteSkillWarning", {
              defaultValue:
                "Are you sure you want to delete this skill? It may cause issues if users or projects already reference it.",
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
    </DashboardLayout>
  );
}
