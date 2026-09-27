import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderKanban, Search, Loader2, Eye, Trash2, Download, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

type ProjectType = {
  id: number;
  title: string;
  status: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
  skills?: { name: string }[];
};

export function AdminProjects() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["adminProjects"],
    queryFn: async () => {
      const res = await apiClient.get("/projects/all?limit=100");
      const list = res.data.data?.data || res.data.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const {
    data: projectDetails,
    isLoading: loadingDetails,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["adminProjectDetails", selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject) return null;
      const res = await apiClient.get(`/projects/${selectedProject.id}/admin`);
      return res.data.data || null;
    },
    enabled: !!selectedProject && isViewModalOpen,
  });

  const forceStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiClient.patch(`/projects/${selectedProject?.id}/status`, { status });
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      refetchDetails();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/projects/${selectedProject?.id}/admin`);
    },
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedProject(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete project");
    },
  });

  const openViewModal = (p: ProjectType) => {
    setSelectedProject(p);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (p: ProjectType) => {
    setSelectedProject(p);
    setIsDeleteModalOpen(true);
  };

  const filteredProjects = projects.filter((project: ProjectType) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      project.title.toLowerCase().includes(s) ||
      project.user?.email?.toLowerCase().includes(s) ||
      project.status.toLowerCase().includes(s)
    );
  });

  // Safe names
  const getProjectUserName = (u: any) => {
    if (!u) return "Unknown";
    const fname = u.first_name || u.profile?.first_name || "";
    const lname = u.last_name || u.profile?.last_name || "";
    if (!fname && !lname) return "Unnamed User";
    return `${fname} ${lname}`.trim();
  };

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.projectsTitle", { defaultValue: "Manage Projects" })}
      subtitle={t("admin.projectsSubtitle", {
        defaultValue: "View all projects submitted on the platform.",
      })}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchProjects", {
                defaultValue: "Search by title, email, or status...",
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
                    {t("common.title", { defaultValue: "Title" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.beneficiary", { defaultValue: "Beneficiary" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.status", { defaultValue: "Status" })}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {t("admin.noProjectsFound", { defaultValue: "No projects found." })}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project: ProjectType) => (
                    <tr key={project.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {project.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {getProjectUserName(project.user)}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {project.user?.email || ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(project.created_at, i18n.language)}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewModal(project)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteModal(project)}
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
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={projectDetails?.title || selectedProject?.title || "Project Details"}
      >
        {loadingDetails ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projectDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground">{t("common.status")}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={projectDetails.status} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-muted-foreground">
                  {t("common.beneficiary")}
                </h3>
                <p className="mt-1 text-sm font-medium">
                  {getProjectUserName(projectDetails.user)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-muted-foreground">
                {t("common.description", { defaultValue: "Description" })}
              </h3>
              <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {projectDetails.description || "No description provided."}
              </p>
            </div>

            <div className="flex gap-4">
              {projectDetails.github_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={projectDetails.github_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" /> GitHub
                  </a>
                </Button>
              )}
              {projectDetails.live_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={projectDetails.live_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" /> Live Site
                  </a>
                </Button>
              )}
            </div>

            {projectDetails.evidence && projectDetails.evidence.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-2">
                  Evidence / Documents
                </h3>
                <div className="space-y-2">
                  {projectDetails.evidence.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <span className="text-sm font-medium truncate max-w-[300px]">
                        {ev.document?.name || "Document"}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={ev.document?.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" /> Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-muted-foreground mb-2">
                Admin Actions (Force Status)
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forceStatusMutation.mutate("draft")}
                  disabled={forceStatusMutation.isPending}
                >
                  Set Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forceStatusMutation.mutate("submitted")}
                  disabled={forceStatusMutation.isPending}
                >
                  Set Submitted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forceStatusMutation.mutate("under_review")}
                  disabled={forceStatusMutation.isPending}
                >
                  Set Under Review
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => forceStatusMutation.mutate("verified")}
                  disabled={forceStatusMutation.isPending}
                >
                  Set Verified
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p>Failed to load project details.</p>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("common.confirm", { defaultValue: "Are you sure?" })}
      >
        <div className="space-y-4">
          <p className="text-sm">
            Delete project "{selectedProject?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
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
    </DashboardLayout>
  );
}
