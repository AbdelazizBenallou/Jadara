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

type WorkExperience = {
  id: number;
  company: string;
  job_title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
};

type WorkExperienceSectionProps = {
  onUpdate?: () => void;
};

export function WorkExperienceSection({ onUpdate }: WorkExperienceSectionProps) {
  const { t, i18n } = useTranslation();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const res = await apiClient.get("/users/me/work-experience");
      setExperiences(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("error.title")); // Generic or specific error
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        company: formData.company,
        job_title: formData.job_title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.is_current ? null : formData.end_date || null,
        is_current: formData.is_current,
      };

      if (editingId) {
        await apiClient.patch(`/users/me/work-experience/${editingId}`, payload);
        toast.success(t("common.saved"));
      } else {
        await apiClient.post("/users/me/work-experience", payload);
        toast.success(t("common.saved"));
      }
      setIsDialogOpen(false);
      await fetchExperiences();
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
      await apiClient.delete(`/users/me/work-experience/${id}`);
      toast.success(t("common.deletedSuccess"));
      await fetchExperiences();
      onUpdate?.();
    } catch (err) {
      toast.error(t("error.title"));
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t("cv.workExperience")}</h3>
        <Button onClick={() => handleOpenDialog()} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> {t("cv.addExperience")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : experiences.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("cv.noWorkExperience")}</p>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="group relative rounded-xl border p-4 hover:border-primary/50 transition-colors"
            >
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-blue-600"
                  onClick={() => handleOpenDialog(exp)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  onClick={() => handleDelete(exp.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <h4 className="font-semibold">{exp.job_title}</h4>
              <p className="text-sm text-muted-foreground mb-2">{exp.company}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3.5 w-3.5" />
                {exp.start_date ? formatDate(exp.start_date, i18n.language) : ""} -{" "}
                {exp.is_current
                  ? t("cv.present")
                  : exp.end_date
                    ? formatDate(exp.end_date, i18n.language)
                    : ""}
              </div>
              {exp.description && <p className="text-sm">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? t("cv.editExperience") : t("cv.addExperience")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company">{t("cv.company")}</Label>
              <Input
                id="company"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job_title">{t("cv.jobTitle")}</Label>
              <Input
                id="job_title"
                required
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
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
              <Label htmlFor="is_current">{t("cv.currentlyWorkHere")}</Label>
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
