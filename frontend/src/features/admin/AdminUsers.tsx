import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Loader2,
  Edit2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  addUserSkill,
  getUserSkills,
  listSkills,
  removeUserSkill,
} from "@/api/skills";
import {
  deleteUser,
  getUserReviewDomains,
  listUsers,
  updateUser,
} from "@/api/users";
import {
  listDomains,
  removeReviewerDomain,
  setReviewerDomains,
} from "@/api/domains";
import { getErrorMessage } from "@/lib/notify";
import { queryKeys } from "@/lib/query-keys";
import type { Domain } from "@/types/domain";
import type { Skill, UserSkill } from "@/types/skill";
import type { User } from "@/types/user";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

export function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDomainsModalOpen, setIsDomainsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    status: "active",
    first_name: "",
    last_name: "",
  });
  const [userDomains, setUserDomains] = useState<number[]>([]);
  const [originalDomainId, setOriginalDomainId] = useState<number | null>(null);
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("beginner");

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users.list({ scope: "admin" }),
    queryFn: () => listUsers({ limit: 100 }).then((result) => result.items),
  });

  const { data: allDomains = [] } = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: queryKeys.skills.list({ limit: 1000 }),
    queryFn: () => listSkills({ limit: 1000 }),
  });

  const { data: userSkills = [], refetch: refetchSkills } = useQuery({
    queryKey: queryKeys.users.skills(selectedUser?.id ?? "none"),
    queryFn: () => getUserSkills(selectedUser!.id),
    enabled: !!selectedUser && isSkillsModalOpen,
  });

  const editMutation = useMutation({
    mutationFn: (data: typeof formData) => updateUser(selectedUser!.id, data),
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Saved successfully" }));
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update user"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(selectedUser!.id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin });
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete user"));
    },
  });

  const saveDomainsMutation = useMutation({
    mutationFn: async (domains: number[]) => {
      const userId = selectedUser?.id;
      if (!userId) throw new Error("No user selected");
      if (domains.length > 0) {
        await setReviewerDomains(userId, domains[0]);
      } else if (originalDomainId != null) {
        await removeReviewerDomain(userId, originalDomainId);
      }
    },
    onSuccess: () => {
      toast.success("Domains updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setIsDomainsModalOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update domains"));
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: () =>
      addUserSkill(selectedUser!.id, {
        skill_id: Number(newSkillId),
        level: newSkillLevel as UserSkill["level"],
      }),
    onSuccess: () => {
      toast.success("Skill added successfully");
      refetchSkills();
      setNewSkillId("");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to add skill"));
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (skillId: number) => removeUserSkill(selectedUser!.id, skillId),
    onSuccess: () => {
      toast.success("Skill removed successfully");
      refetchSkills();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to remove skill"));
    },
  });

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setFormData({
      status: u.status,
      first_name: u.profile?.first_name || "",
      last_name: u.profile?.last_name || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (u: User) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const openDomainsModal = async (u: User) => {
    setSelectedUser(u);
    setIsDomainsModalOpen(true);
    try {
      const domain = await getUserReviewDomains(u.id);
      setOriginalDomainId(domain?.id ?? null);
      setUserDomains(domain?.id ? [domain.id] : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load domains"));
    }
  };

  const toggleUserDomain = (id: number) => {
    setUserDomains((prev) => (prev.includes(id) ? [] : [id]));
  };

  const openSkillsModal = (u: User) => {
    setSelectedUser(u);
    setIsSkillsModalOpen(true);
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name =
      `${user.profile?.first_name || ""} ${user.profile?.last_name || ""}`.toLowerCase();
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
      subtitle={t("admin.usersSubtitle", {
        defaultValue: "View and filter all registered users.",
      })}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchUsers", {
                defaultValue: "Search by email, name or role...",
              })}
              className="pl-9 rtl:pr-9 rtl:pl-3"
            />
          </div>
          <div className="text-xs font-semibold text-[#6C757D]">
            Showing <span className="text-[#212529] font-bold">{filteredUsers.length}</span> registered accounts
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
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {t("admin.noUsersFound", {
                        defaultValue: "No users found.",
                      })}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/admin/users/$id",
                              params: { id: String(user.id) },
                            })
                          }
                          className="flex items-center gap-3 text-left group cursor-pointer"
                          title="View Profile Dossier"
                        >
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#E9ECEF] bg-[#26183D] text-white shadow-xs">
                            {user.profile?.avatar_url ? (
                              <img
                                src={user.profile.avatar_url}
                                alt={user.name || user.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-xs uppercase group-hover:bg-[#7135E8] transition-colors">
                                {user.profile?.first_name?.charAt(0) || user.email.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="truncate max-w-[150px]">
                            <span className="font-semibold text-foreground group-hover:text-[#7135E8] transition-colors block truncate">
                              {user.profile?.first_name || user.profile?.last_name
                                ? `${user.profile.first_name || ""} ${user.profile.last_name || ""}`.trim()
                                : "Unnamed User"}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate">
                              ID #{user.id}
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize font-medium text-xs rounded-md bg-[#F4F6F9] px-2 py-0.5 border border-[#E9ECEF]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1">
                          {/* Move to normal profile page */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Profile Dossier"
                            onClick={() =>
                              navigate({
                                to: "/admin/users/$id",
                                params: { id: String(user.id) },
                              })
                            }
                            className="text-[#7135E8] hover:text-[#5a2ab8]"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {user.role?.toLowerCase() === "reviewer" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Manage Domains"
                              onClick={() => openDomainsModal(user)}
                            >
                              <ShieldCheck className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {user.role?.toLowerCase() === "beneficiary" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Manage Skills"
                              onClick={() => openSkillsModal(user)}
                            >
                              <Sparkles className="h-4 w-4 text-emerald-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit User"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete User"
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
              <label className="mb-1 block text-sm font-medium">
                First Name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border p-2"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Last Name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border p-2"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
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
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
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
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
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
            {allDomains.map((d) => (
              <label
                key={d.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
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
              {allSkills.map((s) => (
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
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <Button
              onClick={() => addSkillMutation.mutate()}
              disabled={!newSkillId || addSkillMutation.isPending}
            >
              Add
            </Button>
          </div>

          <div className="border rounded-xl divide-y">
            {userSkills.map((s) => (
              <div
                key={s.skill_id}
                className="flex items-center justify-between p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.level}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSkillMutation.mutate(s.skill_id)}
                  disabled={deleteSkillMutation.isPending}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {userSkills.length === 0 && (
              <p className="p-4 text-center text-muted-foreground text-sm">
                No skills found.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
