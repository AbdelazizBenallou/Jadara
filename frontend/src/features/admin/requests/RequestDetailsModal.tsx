import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Download, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type RequestDetailsModalProps = {
  demandId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
  demandData?: any;
};

export function RequestDetailsModal({
  demandId,
  isOpen,
  onClose,
  onStatusChange,
  demandData,
}: RequestDetailsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!demandId) return;
      await apiClient.post(`/demands/${demandId}/approve`, { note });
    },
    onSuccess: () => {
      toast.success(t("admin.requestApproved"));
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      onStatusChange();
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error(t("admin.requestAlreadyReviewed"));
      } else {
        toast.error(error.response?.data?.message || "Failed to approve");
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!demandId) return;
      await apiClient.post(`/demands/${demandId}/reject`, { note });
    },
    onSuccess: () => {
      toast.success(t("admin.requestRejected"));
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      onStatusChange();
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error(t("admin.requestAlreadyReviewed"));
      } else {
        toast.error(error.response?.data?.message || "Failed to reject");
      }
      setRejecting(false);
    },
  });

  const handleApprove = () => approveMutation.mutate();
  const handleReject = () => rejectMutation.mutate();

  if (!isOpen || !demandData) return null;

  const isPending = demandData.status?.toLowerCase() === "pending";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.details")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t("admin.applicant")}</Label>
              <p className="font-medium">
                {demandData.applicant?.profiles?.first_name ||
                  demandData.applicant?.profile?.first_name ||
                  ""}{" "}
                {demandData.applicant?.profiles?.last_name ||
                  demandData.applicant?.profile?.last_name ||
                  ""}
              </p>
              <p className="text-sm text-muted-foreground">{demandData.applicant?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("admin.requestedRole")}</Label>
              <p className="font-medium">{demandData.role?.name || demandData.requested_role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("common.status")}</Label>
              <p className="font-medium capitalize">
                {t(`admin.${demandData.status?.toLowerCase()}`, {
                  defaultValue: demandData.status,
                })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("admin.submitted")}</Label>
              <p className="font-medium">{new Date(demandData.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {demandData.domains && demandData.domains.length > 0 && (
            <div>
              <Label className="text-muted-foreground">{t("admin.requestedDomains")}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {demandData.domains.map((domain: any) => (
                  <span
                    key={domain.id}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                  >
                    {domain.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {demandData.documents && demandData.documents.length > 0 && (
            <div>
              <Label className="text-muted-foreground">{t("admin.documents")}</Label>
              <div className="mt-2 space-y-2">
                {demandData.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {doc.name}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                        {t("admin.download")}
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPending && (
            <div className="space-y-2 pt-4 border-t">
              <Label>{rejecting ? t("admin.rejectionReason") : t("admin.reviewNote")}</Label>
              <Textarea
                placeholder={rejecting ? t("admin.rejectionReason") : t("admin.reviewNote")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {!isPending && demandData.review_note && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-muted-foreground">{t("admin.reviewNote")}</Label>
              <p className="text-sm rounded-lg bg-muted p-3">{demandData.review_note}</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between flex-row-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("admin.cancel")}
          </Button>

          {isPending && (
            <div className="flex flex-row-reverse sm:flex-row gap-2">
              {!rejecting ? (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                    )}
                    {t("admin.approve")}
                  </Button>
                  <Button variant="destructive" onClick={() => setRejecting(true)}>
                    <XCircle className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                    {t("admin.reject")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                    )}
                    {t("admin.confirm")}
                  </Button>
                  <Button variant="outline" onClick={() => setRejecting(false)}>
                    {t("admin.cancel")}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
