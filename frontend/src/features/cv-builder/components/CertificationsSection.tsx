import { useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Calendar, Award, ExternalLink } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCertification,
  listCertifications,
  removeCertification,
  updateCertification,
} from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/formatDate";
import { useTranslation } from "react-i18next";
import type { Certification } from "@/types/cv";

type CertificationsSectionProps = {
  onUpdate?: () => void;
};

export function CertificationsSection({ onUpdate }: CertificationsSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    issue_date: "",
    expiry_date: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const certificationsQuery = useQuery({
    queryKey: queryKeys.cv.certifications,
    queryFn: listCertifications,
  });
  const certifications = certificationsQuery.data ?? [];
  const loading = certificationsQuery.isLoading;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.certifications });
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.data });
  };

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editingId ? updateCertification(editingId, data) : createCertification(data),
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Saved successfully!" }));
      setIsDialogOpen(false);
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const deleteMutation = useMutation({
    mutationFn: removeCertification,
    onSuccess: () => {
      toast.success(t("common.deleted", { defaultValue: "Deleted successfully!" }));
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const handleOpenDialog = (cert?: Certification) => {
    if (cert) {
      setEditingId(cert.id);
      setFormData({
        name: cert.name,
        issuer: cert.issuer || "",
        issue_date: cert.issue_date ? cert.issue_date.split("T")[0] : "",
        expiry_date: cert.expiry_date ? cert.expiry_date.split("T")[0] : "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        issuer: "",
        issue_date: "",
        expiry_date: "",
      });
    }
    setFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    if (formData.issuer) data.append("issuer", formData.issuer);
    if (formData.issue_date) data.append("issue_date", formData.issue_date);
    if (formData.expiry_date) data.append("expiry_date", formData.expiry_date);
    if (file) data.append("file", file);

    saveMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("common.confirmDelete", { defaultValue: "Are you sure you want to delete this certificate?" }))) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[#7135E8]" />
          <h3 className="text-base font-bold text-[#212529]">
            {t("docs.certificate", { defaultValue: "Certifications & Accreditations" })}
          </h3>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t("cv.addCertificate", { defaultValue: "Add Certificate" })}</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#7135E8]" />
        </div>
      ) : certifications.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#6C757D] rounded-xl border border-dashed border-[#E9ECEF]">
          <p>{t("cv.noCertificates", { defaultValue: "No certifications added yet." })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col justify-between rounded-xl border border-[#E9ECEF] bg-white p-4.5 hover:border-[#7135E8] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#212529]">{cert.name}</h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDialog(cert)}
                      className="rounded p-1 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#7135E8]"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cert.id)}
                      className="rounded p-1 text-[#DC3545] hover:bg-[#DC3545]/10"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {cert.issuer && (
                  <p className="text-xs font-semibold text-[#7135E8] mt-0.5">{cert.issuer}</p>
                )}
                {cert.issue_date && (
                  <p className="text-[11px] text-[#6C757D] mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Issued: {formatDate(cert.issue_date)}</span>
                  </p>
                )}
              </div>

              {cert.file_url && (
                <div className="mt-3 border-t border-[#E9ECEF] pt-2">
                  <a
                    href={cert.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D6EFD] hover:underline"
                  >
                    <span>View Credential File</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white border-[#E9ECEF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#212529]">
              {editingId
                ? t("cv.editCertificate", { defaultValue: "Edit Certification" })
                : t("cv.addCertificate", { defaultValue: "Add Certification" })}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.certName", { defaultValue: "Certification Name" })}
              </Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="AWS Certified Solutions Architect"
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.issuer", { defaultValue: "Issuing Organization" })}
              </Label>
              <Input
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                placeholder="Amazon Web Services, Coursera, Cisco..."
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#212529]">
                  {t("cv.issueDate", { defaultValue: "Issue Date" })}
                </Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="border-[#E9ECEF] text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#212529]">
                  {t("cv.expiryDate", { defaultValue: "Expiry Date (optional)" })}
                </Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="border-[#E9ECEF] text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.certFile", { defaultValue: "Upload Credential Document (PDF/Image)" })}
              </Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-[#E9ECEF] text-xs text-[#6C757D]"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold"
              >
                {saveMutation.isPending ? "Saving..." : t("common.save", { defaultValue: "Save" })}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
