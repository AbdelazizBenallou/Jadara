import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attachSkillsToDomain,
  createSkill,
  createSkillCategory,
  deleteSkill,
  deleteSkillCategory,
  getDomainSkills,
  listSkillCategories,
  listSkills,
  updateSkill,
} from "@/api/skills";
import { listDomains } from "@/api/domains";
import { getErrorMessage } from "@/lib/notify";
import { queryKeys } from "@/lib/query-keys";
import type { Domain } from "@/types/domain";
import type { Skill } from "@/types/skill";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

export function AdminSkills() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  // Forms state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    category_id: "",
    domain_ids: [] as number[],
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: queryKeys.skills.categories,
    queryFn: () => listSkillCategories({ limit: 100 }),
  });

  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });

  const {
    data: skillsData,
    isLoading: isLoadingSkills,
  } = useQuery({
    queryKey: queryKeys.skills.list({ scope: "admin" }),
    queryFn: async () => {
      const skills = await listSkills({ limit: 1000 });
      const map: Record<number, Domain[]> = {};

      await Promise.all(
        domains.map(async (domain) => {
          try {
            const domainSkills = await getDomainSkills(domain.id);
            domainSkills.forEach((skill) => {
              if (!map[skill.id]) map[skill.id] = [];
              map[skill.id].push(domain);
            });
          } catch {
            return;
          }
        }),
      );

      return { skills, skillDomainMap: map };
    },
    enabled: !isLoadingDomains,
  });

  const skills = skillsData?.skills ?? [];
  const skillDomainMap = skillsData?.skillDomainMap ?? {};
  const isLoading = isLoadingDomains || isLoadingSkills || isLoadingCategories;

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
      const created = await createSkill({
        name: data.name,
        description: data.description,
        status: data.status,
        category_id: Number(data.category_id),
      });

      for (const domainId of data.domain_ids) {
        await attachSkillsToDomain(domainId, [created.id]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.skillAdded", { defaultValue: "Skill created successfully" }));
      setIsAddModalOpen(false);
      setFormData({ name: "", description: "", status: "active", category_id: "", domain_ids: [] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.skillAddError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      await updateSkill(data.id, {
        name: data.name,
        description: data.description,
        status: data.status,
        category_id: Number(data.category_id),
      });

      const oldDomains = skillDomainMap[data.id]?.map((d) => d.id) ?? [];
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

      for (const domainId of newDomainIds) {
        try {
          await attachSkillsToDomain(domainId, [data.id]);
        } catch {
          continue;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.skillUpdated", { defaultValue: "Skill updated successfully" }));
      setIsEditModalOpen(false);
      setSelectedSkill(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.skillUpdateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success(t("admin.skillDeleted", { defaultValue: "Skill deleted successfully" }));
      setIsDeleteModalOpen(false);
      setSelectedSkill(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.skillDeleteError"));
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      createSkillCategory({
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.categories });
      toast.success(t("admin.categoryAdded", { defaultValue: "Category created successfully" }));
      setCategoryForm({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.categoryAddError"));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteSkillCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.categories });
      toast.success(t("admin.categoryDeleted", { defaultValue: "Category deleted successfully" }));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "admin.categoryDeleteError"));
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
      category_id: skill.category_id ? String(skill.category_id) : "",
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsCategoriesModalOpen(true)}>
              <BookOpen className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t("admin.manageCategories", { defaultValue: "Categories" })}
            </Button>
            <Button
              onClick={() => {
                setFormData({
                  name: "",
                  description: "",
                  status: "active",
                  category_id: "",
                  domain_ids: [],
                });
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t("admin.addSkill", { defaultValue: "Add Skill" })}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                      {t("admin.category", { defaultValue: "Category" })}
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
                      <td className="px-6 py-4 text-muted-foreground">
                        {skill.category?.name || "-"}
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
              {t("admin.category", { defaultValue: "Category" })}
            </label>
            <select
              required
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="" disabled>
                {t("admin.selectCategory", { defaultValue: "Select a category..." })}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              {t("admin.category", { defaultValue: "Category" })}
            </label>
            <select
              required
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="" disabled>
                {t("admin.selectCategory", { defaultValue: "Select a category..." })}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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

      <Modal
        isOpen={isCategoriesModalOpen}
        onClose={() => {
          if (!createCategoryMutation.isPending) {
            setIsCategoriesModalOpen(false);
            setCategoryForm({ name: "", description: "" });
          }
        }}
        title={t("admin.manageCategories", { defaultValue: "Skill Categories" })}
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            {isLoadingCategories ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("admin.noCategories", { defaultValue: "No categories yet." })}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      {c.description ? (
                        <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteCategoryMutation.mutate(c.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!categoryForm.name.trim()) return;
              createCategoryMutation.mutate(categoryForm);
            }}
            className="space-y-3 rounded-xl border bg-muted/20 p-4"
          >
            <p className="text-sm font-medium">
              {t("admin.addCategory", { defaultValue: "Add a category" })}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                required
                placeholder={t("common.title", { defaultValue: "Title" })}
                className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary sm:w-1/3"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("common.description", { defaultValue: "Description" })}
                className="w-full flex-1 rounded-xl border bg-background px-3 py-2 outline-none focus:border-primary"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
              <div className="flex shrink-0 justify-end">
                <Button type="submit" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                  )}
                  {t("common.add", { defaultValue: "Add" })}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
