import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Loader2, Edit2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

type UserType = {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
};

export function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDomainsModalOpen, setIsDomainsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  const [formData, setFormData] = useState({ status: "active", first_name: "", last_name: "" });
  const [userDomains, setUserDomains] = useState<number[]>([]);
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("Beginner");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await apiClient.get("/users?limit=100");
      const list = res.data.data?.data || res.data.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: allDomains = [] } = useQuery({
    queryKey: ["adminDomains"],
    queryFn: async () => {
      const res = await apiClient.get("/domains?limit=100");
      const list = res.data.data?.data || res.data.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["adminSkills"],
    queryFn: async () => {
      const res = await apiClient.get("/skills?limit=1000");
      const list = res.data.data?.data || res.data.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: userSkills = [], refetch: refetchSkills } = useQuery({
    queryKey: ["adminUserSkills", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const res = await apiClient.get(`/users/${selectedUser.id}/skills`);
      return res.data.data || [];
    },
    enabled: !!selectedUser && isSkillsModalOpen,
  });

  const editMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiClient.patch(`/users/${selectedUser?.id}`, data);
    },
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Saved successfully" }));
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/users/${selectedUser?.id}`);
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setIsDeleteModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete user");
    },
  });

  const saveDomainsMutation = useMutation({
    mutationFn: async (domains: number[]) => {
      if (domains.length === 0) throw new Error("At least one domain is required.");
      await apiClient.put(`/users/${selectedUser?.id}/review-domains`, { domain_ids: domains });
    },
    onSuccess: () => {
      toast.success("Domains updated successfully");
      setIsDomainsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update domains");
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/users/${selectedUser?.id}/skills`, {
        skills: [{ skill_id: Number(newSkillId), level: newSkillLevel }],
      });
    },
    onSuccess: () => {
      toast.success("Skill added successfully");
      refetchSkills();
      setNewSkillId("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add skill");
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      await apiClient.delete(`/users/${selectedUser?.id}/skills/${skillId}`);
    },
    onSuccess: () => {
      toast.success("Skill removed successfully");
      refetchSkills();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove skill");
    },
  });

  const openEditModal = (u: UserType) => {
    setSelectedUser(u);
    setFormData({
      status: u.status,
      first_name: u.profile?.first_name || "",
      last_name: u.profile?.last_name || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (u: UserType) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const openDomainsModal = async (u: UserType) => {
    setSelectedUser(u);
    setIsDomainsModalOpen(true);
    try {
      const res = await apiClient.get(`/users/${u.id}/review-domains`);
      const doms = res.data.data || [];
      setUserDomains(doms.map((d: any) => d.id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load domains");
    }
  };

  const toggleUserDomain = (id: number) => {
    setUserDomains((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const openSkillsModal = (u: UserType) => {
    setSelectedUser(u);
    setIsSkillsModalOpen(true);
  };

  const filteredUsers = users.filter((user: UserType) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${user.profile?.first_name || ""} ${user.profile?.last_name || ""}`.toLowerCase();
    return (
      user.email.toLowerCase().includes(s) ||
      name.includes(s) ||
      user.role.toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.usersTitle", { defaultValue: "Manage Users" })}
      subtitle={t("admin.usersSubtitle", { defaultValue: "View and filter all registered users." })}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchUsers", {
                defaultValue: "Search by email, name or role...",
              })}
              className="pl-9 rtl:pr-9 rtl:pl-3"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    {t("common.name", { defaultValue: "Name" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.email", { defaultValue: "Email" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.role", { defaultValue: "Role" })}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {t("admin.noUsersFound", { defaultValue: "No users found." })}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: UserType) => (
                    <tr key={user.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {user.profile?.first_name || user.profile?.last_name
                              ? `${user.profile.first_name || ""} ${user.profile.last_name || ""}`
                              : "Unnamed User"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{user.email}</td>
                      <td className="px-6 py-4 capitalize">{user.role}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1">
                          {user.role === "reviewer" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Manage Domains"
                              onClick={() => openDomainsModal(user)}
                            >
                              <ShieldCheck className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {user.role === "beneficiary" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Manage Skills"
                              onClick={() => openSkillsModal(user)}
                            >
                              <Sparkles className="h-4 w-4 text-emerald-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(user)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t("common.edit", { defaultValue: "Edit" })}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name</label>
              <input
                type="text"
                className="w-full rounded-xl border p-2"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name</label>
              <input
                type="text"
                className="w-full rounded-xl border p-2"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("common.status", { defaultValue: "Status" })}
            </label>
            <select
              className="w-full rounded-xl border p-2"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="locked">Locked</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={editMutation.isPending}>
              {t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("common.confirm", { defaultValue: "Are you sure?" })}
      >
        <div className="space-y-4">
          <p>Delete user {selectedUser?.email}?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDomainsModalOpen}
        onClose={() => setIsDomainsModalOpen(false)}
        title="Manage Reviewer Domains"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-xl border p-3">
            {allDomains.map((d: any) => (
              <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={userDomains.includes(d.id)}
                  onChange={() => toggleUserDomain(d.id)}
                  className="rounded text-primary focus:ring-primary"
                />
                {d.name}
              </label>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => saveDomainsMutation.mutate(userDomains)}
              disabled={saveDomainsMutation.isPending}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        title="Manage Beneficiary Skills"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              className="rounded-xl border p-2 flex-1"
              value={newSkillId}
              onChange={(e) => setNewSkillId(e.target.value)}
            >
              <option value="">Select a skill...</option>
              {allSkills.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border p-2 w-32"
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <Button
              onClick={() => addSkillMutation.mutate()}
              disabled={!newSkillId || addSkillMutation.isPending}
            >
              Add
            </Button>
          </div>

          <div className="border rounded-xl divide-y">
            {userSkills.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">{s.skill?.name}</p>
                  <p className="text-xs text-muted-foreground">{s.level}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSkillMutation.mutate(s.id)}
                  disabled={deleteSkillMutation.isPending}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {userSkills.length === 0 && (
              <p className="p-4 text-center text-muted-foreground text-sm">No skills found.</p>
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
