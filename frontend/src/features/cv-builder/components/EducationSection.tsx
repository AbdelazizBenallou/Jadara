import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Calendar } from "lucide-react";
import { apiClient } from "@/api/client";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/formatDate";
import { useTranslation } from "react-i18next";

type Education = {
  id: number;
  school: string;
  degree: string;
  field_of_study?: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
};

type EducationSectionProps = {
  onUpdate?: () => void;
};

export function EducationSection({ onUpdate }: EducationSectionProps) {
  const { t, i18n } = useTranslation();
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      const res = await apiClient.get("/users/me/education");
      setEducationList(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("error.title"));
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        school: formData.school,
        degree: formData.degree,
        field_of_study: formData.field_of_study,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.is_current ? null : formData.end_date || null,
        is_current: formData.is_current,
      };

      if (editingId) {
        await apiClient.patch(`/users/me/education/${editingId}`, payload);
        toast.success(t("common.saved"));
      } else {
        await apiClient.post("/users/me/education", payload);
        toast.success(t("common.saved"));
      }
      setIsDialogOpen(false);
      await fetchEducation();
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
      await apiClient.delete(`/users/me/education/${id}`);
      toast.success(t("common.deletedSuccess"));
      await fetchEducation();
      onUpdate?.();
    } catch (err) {
      toast.error(t("error.title"));
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t("cv.education")}</h3>
        <Button onClick={() => handleOpenDialog()} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> {t("cv.addEducation")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : educationList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("cv.noEducation")}</p>
      ) : (
        <div className="space-y-4">
          {educationList.map((edu) => (
            <div
              key={edu.id}
              className="group relative rounded-xl border p-4 hover:border-primary/50 transition-colors"
            >
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-blue-600"
                  onClick={() => handleOpenDialog(edu)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  onClick={() => handleDelete(edu.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <h4 className="font-semibold">
                {edu.degree}
                {edu.field_of_study ? ` in ${edu.field_of_study}` : ""}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">{edu.school}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3.5 w-3.5" />
                {edu.start_date ? formatDate(edu.start_date, i18n.language) : ""} -{" "}
                {edu.is_current
                  ? t("cv.present")
                  : edu.end_date
                    ? formatDate(edu.end_date, i18n.language)
                    : ""}
              </div>
              {edu.description && <p className="text-sm">{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? t("cv.editEducation") : t("cv.addEducation")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="school">{t("cv.school")}</Label>
              <Input
                id="school"
                required
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degree">{t("cv.degree")}</Label>
              <Input
                id="degree"
                required
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="field_of_study">{t("cv.fieldOfStudy")}</Label>
              <Input
                id="field_of_study"
                value={formData.field_of_study}
                onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">{t("cv.startDate")}</Label>
                <Input
                  id="start_date"
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">{t("cv.endDate")}</Label>
                <Input
                  id="end_date"
                  type="date"
                  required={!formData.is_current}
                  disabled={formData.is_current}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_current"
                checked={formData.is_current}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_current: checked as boolean })
                }
              />
              <Label htmlFor="is_current">{t("cv.currentlyStudyHere")}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("cv.description")}</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
