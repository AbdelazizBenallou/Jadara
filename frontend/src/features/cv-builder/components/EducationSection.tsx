import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Calendar, GraduationCap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEducation,
  listEducation,
  removeEducation,
  updateEducation,
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
import type { Education, EducationInput } from "@/types/cv";

type EducationSectionProps = {
  onUpdate?: () => void;
};

export function EducationSection({ onUpdate }: EducationSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    school: "",
    degree: "",
    field_of_study: "",
    description: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const educationQuery = useQuery({
    queryKey: queryKeys.cv.education,
    queryFn: listEducation,
  });
  const educationList = educationQuery.data ?? [];
  const loading = educationQuery.isLoading;

  useEffect(() => {
    if (educationQuery.error) {
      notifyError(educationQuery.error, "error.title");
    }
  }, [educationQuery.error]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.education });
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.data });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: EducationInput }) =>
      id ? updateEducation(id, input) : createEducation(input),
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Saved successfully!" }));
      setIsDialogOpen(false);
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const deleteMutation = useMutation({
    mutationFn: removeEducation,
    onSuccess: () => {
      toast.success(t("common.deleted", { defaultValue: "Deleted successfully!" }));
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const handleOpenDialog = (edu?: Education) => {
    if (edu) {
      setEditingId(edu.id);
      setFormData({
        school: edu.school,
        degree: edu.degree,
        field_of_study: edu.field_of_study || "",
        description: edu.description || "",
        start_date: edu.start_date ? edu.start_date.split("T")[0] : "",
        end_date: edu.end_date ? edu.end_date.split("T")[0] : "",
        is_current: edu.is_current,
      });
    } else {
      setEditingId(null);
      setFormData({
        school: "",
        degree: "",
        field_of_study: "",
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
    const payload: EducationInput = {
      school: formData.school,
      degree: formData.degree,
      field_of_study: formData.field_of_study,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current,
    };
    saveMutation.mutate({ id: editingId, input: payload });
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("common.confirmDelete", { defaultValue: "Are you sure you want to delete this education entry?" }))) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#7135E8]" />
          <h3 className="text-base font-bold text-[#212529]">
            {t("cv.education", { defaultValue: "Education History" })}
          </h3>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t("cv.addEducation", { defaultValue: "Add Education" })}</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#7135E8]" />
        </div>
      ) : educationList.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#6C757D] rounded-xl border border-dashed border-[#E9ECEF]">
          <p>{t("cv.noEducation", { defaultValue: "No education history added yet." })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {educationList.map((edu) => (
            <div
              key={edu.id}
              className="rounded-xl border border-[#E9ECEF] bg-white p-4.5 hover:border-[#7135E8] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#212529]">
                    {edu.degree} in {edu.field_of_study || "General Studies"}
                  </h4>
                  <p className="text-xs font-semibold text-[#7135E8] mt-0.5">{edu.school}</p>
                  <p className="text-[11px] text-[#6C757D] mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(edu.start_date)} - {edu.is_current ? t("common.present", { defaultValue: "Present" }) : edu.end_date ? formatDate(edu.end_date) : "N/A"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDialog(edu)}
                    className="rounded p-1.5 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#7135E8] transition-colors"
                    title={t("common.edit", { defaultValue: "Edit" })}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(edu.id)}
                    className="rounded p-1.5 text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors"
                    title={t("common.delete", { defaultValue: "Delete" })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {edu.description && (
                <p className="text-xs text-[#6C757D] mt-2 whitespace-pre-line leading-relaxed border-t border-[#E9ECEF] pt-2">
                  {edu.description}
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
                ? t("cv.editEducation", { defaultValue: "Edit Education" })
                : t("cv.addEducation", { defaultValue: "Add Education" })}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.school", { defaultValue: "School / University" })}
              </Label>
              <Input
                required
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="University of Algiers"
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.degree", { defaultValue: "Degree / Qualification" })}
              </Label>
              <Input
                required
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="Bachelor's, Master's, Licence..."
                className="border-[#E9ECEF] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.fieldOfStudy", { defaultValue: "Field of Study" })}
              </Label>
              <Input
                value={formData.field_of_study}
                onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                placeholder="Computer Science, Business..."
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
                id="edu_is_current"
                checked={formData.is_current}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_current: !!checked })
                }
              />
              <Label htmlFor="edu_is_current" className="text-xs cursor-pointer text-[#212529]">
                {t("cv.currentlyStudying", { defaultValue: "I am currently enrolled here" })}
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.description", { defaultValue: "Activities & Distinctions" })}
              </Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Relevant coursework, honors, leadership roles..."
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
