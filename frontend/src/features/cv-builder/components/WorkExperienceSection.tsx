import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Calendar, Briefcase } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkExperience,
  listWorkExperience,
  removeWorkExperience,
  updateWorkExperience,
} from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/formatDate";
import { useTranslation } from "react-i18next";
import type { WorkExperience, WorkExperienceInput } from "@/types/cv";

type WorkExperienceSectionProps = {
  onUpdate?: () => void;
};

export function WorkExperienceSection({ onUpdate }: WorkExperienceSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    job_title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const experiencesQuery = useQuery({
    queryKey: queryKeys.cv.workExperience,
    queryFn: listWorkExperience,
  });
  const experiences = experiencesQuery.data ?? [];
  const loading = experiencesQuery.isLoading;

  useEffect(() => {
    if (experiencesQuery.error) {
      notifyError(experiencesQuery.error, "error.title");
    }
  }, [experiencesQuery.error]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.workExperience });
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.data });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: WorkExperienceInput }) =>
      id ? updateWorkExperience(id, input) : createWorkExperience(input),
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Saved successfully!" }));
      setIsDialogOpen(false);
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const deleteMutation = useMutation({
    mutationFn: removeWorkExperience,
    onSuccess: () => {
      toast.success(t("common.deleted", { defaultValue: "Deleted successfully!" }));
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const handleOpenDialog = (exp?: WorkExperience) => {
    if (exp) {
      setEditingId(exp.id);
      setFormData({
        company: exp.company,
        job_title: exp.job_title,
        description: exp.description || "",
        start_date: exp.start_date ? exp.start_date.split("T")[0] : "",
        end_date: exp.end_date ? exp.end_date.split("T")[0] : "",
        is_current: exp.is_current,
      });
    } else {
      setEditingId(null);
      setFormData({
        company: "",
        job_title: "",
        description: "",
        start_date: "",
        end_date: "",
        is_current: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: WorkExperienceInput = {
      company: formData.company,
      job_title: formData.job_title,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current,
    };
    saveMutation.mutate({ id: editingId, input: payload });
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("common.confirmDelete", { defaultValue: "Are you sure you want to delete this experience?" }))) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#7135E8]" />
          <h3 className="text-base font-bold text-[#212529]">
            {t("cv.workExperience", { defaultValue: "Work Experience" })}
          </h3>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t("cv.addExperience", { defaultValue: "Add Experience" })}</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#7135E8]" />
        </div>
      ) : experiences.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#6C757D] rounded-xl border border-dashed border-[#E9ECEF]">
          <p>{t("cv.noWorkExperience", { defaultValue: "No work experience added yet." })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl border border-[#E9ECEF] bg-white p-4.5 hover:border-[#7135E8] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#212529]">{exp.job_title}</h4>
                  <p className="text-xs font-semibold text-[#7135E8] mt-0.5">{exp.company}</p>
                  <p className="text-[11px] text-[#6C757D] mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(exp.start_date)} - {exp.is_current ? t("common.present", { defaultValue: "Present" }) : exp.end_date ? formatDate(exp.end_date) : "N/A"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDialog(exp)}
                    className="rounded p-1.5 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#7135E8] transition-colors"
                    title={t("common.edit", { defaultValue: "Edit" })}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    className="rounded p-1.5 text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors"
                    title={t("common.delete", { defaultValue: "Delete" })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {exp.description && (
                <p className="text-xs text-[#6C757D] mt-2 whitespace-pre-line leading-relaxed border-t border-[#E9ECEF] pt-2">
                  {exp.description}
                </p>
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
                ? t("cv.editExperience", { defaultValue: "Edit Work Experience" })
                : t("cv.addExperience", { defaultValue: "Add Work Experience" })}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.jobTitle", { defaultValue: "Job Title" })}
              </Label>
              <Input
                required
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Software Engineer"
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.company", { defaultValue: "Company" })}
              </Label>
              <Input
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#212529]">
                  {t("cv.startDate", { defaultValue: "Start Date" })}
                </Label>
                <Input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="border-[#E9ECEF] text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#212529]">
                  {t("cv.endDate", { defaultValue: "End Date" })}
                </Label>
                <Input
                  type="date"
                  disabled={formData.is_current}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="border-[#E9ECEF] text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="is_current"
                checked={formData.is_current}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_current: !!checked })
                }
              />
              <Label htmlFor="is_current" className="text-xs cursor-pointer text-[#212529]">
                {t("cv.currentlyWorking", { defaultValue: "I currently work here" })}
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.description", { defaultValue: "Description & Achievements" })}
              </Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe responsibilities and accomplishments..."
                className="border-[#E9ECEF] text-xs leading-relaxed"
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
