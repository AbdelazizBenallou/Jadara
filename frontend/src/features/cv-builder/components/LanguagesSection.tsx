import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Globe } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

type UserLanguage = {
  id: number;
  language_id: number;
  proficiency: string;
  languages?: {
    name: string;
    code: string;
  };
};

type Language = {
  id: number;
  name: string;
  code: string;
};

type LanguagesSectionProps = {
  onUpdate?: () => void;
};

export function LanguagesSection({ onUpdate }: LanguagesSectionProps) {
  const { t } = useTranslation();
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    language_id: "",
    proficiency: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [langsRes, userLangsRes] = await Promise.all([
        apiClient.get("/languages"),
        apiClient.get("/users/me/languages"),
      ]);
      setAvailableLanguages(langsRes.data.data.languages || langsRes.data.data || []);
      setUserLanguages(userLangsRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("error.title"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (lang?: UserLanguage) => {
    if (lang) {
      setEditingId(lang.id);
      setFormData({
        language_id: lang.language_id.toString(),
        proficiency: lang.proficiency,
      });
    } else {
      setEditingId(null);
      setFormData({
        language_id: "",
        proficiency: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.language_id || !formData.proficiency) {
      toast.error(t("error.title"));
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient.patch(`/users/me/languages/${editingId}`, {
          proficiency: formData.proficiency,
        });
        toast.success(t("common.saved"));
      } else {
        await apiClient.post("/users/me/languages", {
          language_id: Number(formData.language_id),
          proficiency: formData.proficiency,
        });
        toast.success(t("common.saved"));
      }
      setIsDialogOpen(false);
      onUpdate?.();
      const res = await apiClient.get("/users/me/languages");
      setUserLanguages(res.data.data.languages || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error.title"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await apiClient.delete(`/users/me/languages/${id}`);
      toast.success(t("common.deletedSuccess"));
      const res = await apiClient.get("/users/me/languages");
      setUserLanguages(res.data.data.languages || []);
    } catch (err) {
      toast.error(t("error.title"));
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t("cv.languages")}</h3>
        <Button onClick={() => handleOpenDialog()} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> {t("cv.addLanguage")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : userLanguages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("cv.noLanguages")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {userLanguages.map((lang) => (
            <div
              key={lang.id}
              className="group relative rounded-xl border p-4 hover:border-primary/50 transition-colors flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {lang.languages?.name || t("cv.unknownLanguage")}
                  </h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {lang.proficiency === "native" && t("cv.proficiencyNative")}
                    {lang.proficiency === "fluent" && t("cv.proficiencyFluent")}
                    {lang.proficiency === "advanced" && t("cv.proficiencyAdvanced")}
                    {lang.proficiency === "intermediate" && t("cv.proficiencyIntermediate")}
                    {lang.proficiency === "beginner" && t("cv.proficiencyBeginner")}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-blue-600"
                  onClick={() => handleOpenDialog(lang)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  onClick={() => handleDelete(lang.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingId ? t("cv.editLanguage") : t("cv.addLanguage")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="language_id">{t("cv.language")}</Label>
              <Select
                value={formData.language_id}
                onValueChange={(val) => setFormData({ ...formData, language_id: val })}
                disabled={!!editingId}
              >
                <SelectTrigger id="language_id">
                  <SelectValue placeholder={t("cv.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((l) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="proficiency">{t("cv.proficiency")}</Label>
              <Select
                value={formData.proficiency}
                onValueChange={(val) => setFormData({ ...formData, proficiency: val })}
              >
                <SelectTrigger id="proficiency">
                  <SelectValue placeholder={t("cv.selectProficiency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">{t("cv.proficiencyNative")}</SelectItem>
                  <SelectItem value="fluent">{t("cv.proficiencyFluent")}</SelectItem>
                  <SelectItem value="advanced">{t("cv.proficiencyAdvanced")}</SelectItem>
                  <SelectItem value="intermediate">{t("cv.proficiencyIntermediate")}</SelectItem>
                  <SelectItem value="beginner">{t("cv.proficiencyBeginner")}</SelectItem>
                </SelectContent>
              </Select>
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
