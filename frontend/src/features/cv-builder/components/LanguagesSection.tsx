import { useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Globe, Languages as LanguagesIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMyLanguage,
  listMyLanguages,
  removeMyLanguage,
  updateMyLanguage,
} from "@/api/users";
import { listLanguages } from "@/api/languages";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import type { LanguageProficiency, UserLanguage } from "@/types/cv";

type LanguagesSectionProps = {
  onUpdate?: () => void;
};

export function LanguagesSection({ onUpdate }: LanguagesSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    language_id: "",
    proficiency: "",
  });

  const availableLanguagesQuery = useQuery({
    queryKey: queryKeys.cv.availableLanguages,
    queryFn: () => listLanguages({ limit: 100 }),
  });
  const availableLanguages = availableLanguagesQuery.data ?? [];

  const myLanguagesQuery = useQuery({
    queryKey: queryKeys.cv.languages,
    queryFn: listMyLanguages,
  });
  const myLanguages = myLanguagesQuery.data ?? [];
  const loading = myLanguagesQuery.isLoading;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.languages });
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.data });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: any }) =>
      id
        ? updateMyLanguage(id, { proficiency: input.proficiency })
        : createMyLanguage(input),
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Saved successfully!" }));
      setIsDialogOpen(false);
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const deleteMutation = useMutation({
    mutationFn: removeMyLanguage,
    onSuccess: () => {
      toast.success(t("common.deleted", { defaultValue: "Deleted successfully!" }));
      invalidate();
      onUpdate?.();
    },
    onError: (error) => notifyError(error, "error.title"),
  });

  const handleOpenDialog = (userLang?: UserLanguage) => {
    if (userLang) {
      setEditingId(userLang.id);
      setFormData({
        language_id: String(userLang.language_id || userLang.languages?.id || ""),
        proficiency: userLang.proficiency,
      });
    } else {
      setEditingId(null);
      setFormData({
        language_id: "",
        proficiency: "intermediate",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.language_id || !formData.proficiency) return;

    saveMutation.mutate({
      id: editingId,
      input: {
        language_id: Number(formData.language_id),
        proficiency: formData.proficiency as LanguageProficiency,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("common.confirmDelete", { defaultValue: "Are you sure you want to remove this language?" }))) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <LanguagesIcon className="h-5 w-5 text-[#7135E8]" />
          <h3 className="text-base font-bold text-[#212529]">
            {t("domain.language", { defaultValue: "Languages" })}
          </h3>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t("cv.addLanguage", { defaultValue: "Add Language" })}</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#7135E8]" />
        </div>
      ) : myLanguages.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#6C757D] rounded-xl border border-dashed border-[#E9ECEF]">
          <p>{t("cv.noLanguages", { defaultValue: "No languages added yet." })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {myLanguages.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 hover:border-[#7135E8] transition-colors"
            >
              <div>
                <h4 className="text-sm font-bold text-[#212529]">
                  {l.languages?.name || "Language"}
                </h4>
                <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold text-[#6C757D] uppercase mt-1 inline-block">
                  {l.proficiency}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenDialog(l)}
                  className="rounded p-1.5 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#7135E8]"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(l.id)}
                  className="rounded p-1.5 text-[#DC3545] hover:bg-[#DC3545]/10"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
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
                ? t("cv.editLanguage", { defaultValue: "Edit Language" })
                : t("cv.addLanguage", { defaultValue: "Add Language" })}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {!editingId && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#212529]">
                  {t("domain.language", { defaultValue: "Language" })}
                </Label>
                <Select
                  value={formData.language_id}
                  onValueChange={(val) => setFormData({ ...formData, language_id: val })}
                >
                  <SelectTrigger className="border-[#E9ECEF] text-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.id} value={String(lang.id)} className="text-xs">
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("cv.proficiency", { defaultValue: "Proficiency Level" })}
              </Label>
              <Select
                value={formData.proficiency}
                onValueChange={(val) => setFormData({ ...formData, proficiency: val })}
              >
                <SelectTrigger className="border-[#E9ECEF] text-xs">
                  <SelectValue placeholder="Select proficiency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner" className="text-xs">Beginner (A1-A2)</SelectItem>
                  <SelectItem value="intermediate" className="text-xs">Intermediate (B1-B2)</SelectItem>
                  <SelectItem value="advanced" className="text-xs">Advanced (C1)</SelectItem>
                  <SelectItem value="fluent" className="text-xs">Fluent (C2)</SelectItem>
                  <SelectItem value="native" className="text-xs">Native Speaker</SelectItem>
                </SelectContent>
              </Select>
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
                disabled={saveMutation.isPending || (!editingId && !formData.language_id)}
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
