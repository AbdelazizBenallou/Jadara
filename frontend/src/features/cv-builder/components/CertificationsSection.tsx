import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Calendar, FileText, Link as LinkIcon } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/formatDate";
import { useTranslation } from "react-i18next";

type Certification = {
  id: number;
  name: string;
  issuer?: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_url?: string | null;
  file_url?: string | null;
};

type CertificationsSectionProps = {
  onUpdate?: () => void;
};

export function CertificationsSection({ onUpdate }: CertificationsSectionProps) {
  const { t, i18n } = useTranslation();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    issue_date: "",
    expiry_date: "",
    credential_url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const res = await apiClient.get("/users/me/certifications");
      setCertifications(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("error.title"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cert?: Certification) => {
    if (cert) {
      setEditingId(cert.id);
      setFormData({
        name: cert.name,
        issuer: cert.issuer || "",
        issue_date: cert.issue_date ? cert.issue_date.split("T")[0] : "",
        expiry_date: cert.expiry_date ? cert.expiry_date.split("T")[0] : "",
        credential_url: cert.credential_url || "",
      });
      setFile(null); // File update is supported but optional
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        issuer: "",
        issue_date: "",
        expiry_date: "",
        credential_url: "",
      });
      setFile(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("issuer", formData.issuer);
      payload.append("issue_date", formData.issue_date);
      payload.append("expiry_date", formData.expiry_date);
      payload.append("credential_url", formData.credential_url);
      if (file) payload.append("file", file);

      if (editingId) {
        await apiClient.patch(`/users/me/certifications/${editingId}`, payload);
        toast.success(t("common.saved"));
      } else {
        await apiClient.post("/users/me/certifications", payload);
        toast.success(t("common.saved"));
      }
      setIsDialogOpen(false);
      await fetchCertifications();
      onUpdate?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error.title"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await apiClient.delete(`/users/me/certifications/${id}`);
      toast.success(t("common.deletedSuccess"));
      await fetchCertifications();
      onUpdate?.();
    } catch (err) {
      toast.error(t("error.title"));
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t("cv.certifications")}</h3>
        <Button onClick={() => handleOpenDialog()} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> {t("cv.addCertification")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : certifications.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("cv.noCertifications")}</p>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="group relative rounded-xl border p-4 hover:border-primary/50 transition-colors flex justify-between items-start"
            >
              <div>
                <h4 className="font-semibold">{cert.name}</h4>
                {cert.issuer && <p className="text-sm text-muted-foreground mb-2">{cert.issuer}</p>}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                  {cert.issue_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Issued: {formatDate(cert.issue_date, i18n.language)}
                    </div>
                  )}
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      {t("cv.credentialLink")}
                    </a>
                  )}
                  {cert.file_url && (
                    <a
                      href={cert.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t("cv.viewCertificate")}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-blue-600"
                  onClick={() => handleOpenDialog(cert)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  onClick={() => handleDelete(cert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("cv.editCertification") : t("cv.addCertification")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("cv.certificationName")}</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issuer">{t("cv.issuer")}</Label>
              <Input
                id="issuer"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issue_date">{t("cv.issueDate")}</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry_date">{t("cv.expiryDate")}</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credential_url">{t("cv.credentialUrl")}</Label>
              <Input
                id="credential_url"
                type="url"
                placeholder="https://"
                value={formData.credential_url}
                onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("cv.certificateFile")}</Label>
              <FileUpload
                accept=".pdf,.png,.jpg,.jpeg"
                maxSizeMB={5}
                onAttach={async (_, __, f) => {
                  setFile(f);
                  return Promise.resolve();
                }}
              />
              <p className="text-xs text-muted-foreground">{t("cv.fileConstraint")}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
