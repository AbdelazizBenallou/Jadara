import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FilePlus, Link as LinkIcon, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileUpload } from "@/components/common/FileUpload";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { STATUS } from "@/constants/statusTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function AddEvidencePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const projectId = Number(id);

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, docsRes] = await Promise.all([
          apiClient.get(`/projects/${projectId}`),
          apiClient.get("/documents"),
        ]);
        setProject(projRes.data.data);
        setDocuments(docsRes.data.data.documents || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <DashboardLayout role="beneficiary" title={t("common.attachProof")}>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="beneficiary" title={t("common.attachProof")}>
        <EmptyState
          icon={<FilePlus className="h-8 w-8 text-muted-foreground/50" />}
          title={t("projects.notFound")}
          description={t("projects.notFoundDesc")}
        />
      </DashboardLayout>
    );
  }

  if (project.status === STATUS.UNDER_REVIEW || project.status === STATUS.VERIFIED) {
    return (
      <DashboardLayout
        role="beneficiary"
        title={t("common.attachProof")}
        backLink={`/dashboard/projects/${project.id}`}
      >
        <EmptyState
          icon={<FilePlus className="h-8 w-8 text-muted-foreground/50" />}
          title={t("common.attachProof")}
          description={t("projects.lockedEdit")}
        />
      </DashboardLayout>
    );
  }

  const handleChooseExisting = async (docId: number) => {
    try {
      await apiClient.post(`/projects/${projectId}/evidence/link`, { document_id: docId });
      toast.success(t("evidence.attachedSuccess", "Evidence linked successfully"));
      navigate({ to: "/dashboard/projects/$id", params: { id: String(project.id) } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to link evidence");
    }
  };

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("common.attachProof")}
      subtitle={t("projects.addEvidenceSubtitle", { title: project.title })}
      backLink={`/dashboard/projects/${project.id}`}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upload" className="gap-2">
                <FilePlus className="h-4 w-4" />
                {t("evidence.uploadFileTab")}
              </TabsTrigger>
              <TabsTrigger value="existing" className="gap-2">
                <FileText className="h-4 w-4" />
                {t("evidence.chooseExistingTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">{t("evidence.uploadDocTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("evidence.uploadDocDesc")}</p>
              </div>
              <FileUpload
                entityType="project_domain"
                entityId={project.id}
                onAttach={async (type, entityId, file) => {
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", type);
                    formData.append("title", file.name);

                    // Override default application/json to let Axios/browser set the multipart boundary automatically
                    await apiClient.post(`/projects/${projectId}/evidence`, formData, {
                      headers: { "Content-Type": undefined },
                    });
                    toast.success(t("evidence.attachedSuccess", "File uploaded successfully"));
                    navigate({ to: "/dashboard/projects/$id", params: { id: String(project.id) } });
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to upload file");
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">{t("evidence.chooseExistingTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("evidence.chooseExistingDesc")}</p>
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {documents.map((doc) => {
                    const isAlreadyAttached = project.evidence?.some(
                      (e: any) => e.external_url === "document:" + doc.id,
                    );
                    return (
                      <div
                        key={doc.id}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-start transition-colors ${isAlreadyAttached ? "bg-muted/50 opacity-70" : "hover:border-primary hover:bg-primary-soft"}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{doc.name}</p>
                            <div className="mt-1">
                              <StatusBadge status={doc.status} />
                            </div>
                          </div>
                        </div>
                        {isAlreadyAttached ? (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("evidence.attachedBadge")}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChooseExisting(doc.id)}
                          >
                            {t("evidence.selectBtn")}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">{t("evidence.noUploadedDocs")}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
