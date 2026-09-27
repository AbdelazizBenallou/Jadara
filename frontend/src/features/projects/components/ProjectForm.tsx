import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import type { Project } from "@/types/project";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Save,
  Loader2,
  Check,
  ChevronsUpDown,
  X as XIcon,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (
    data: Omit<Project, "id" | "created_at" | "updated_at" | "status" | "evidence">,
  ) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ProjectForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ProjectFormProps) {
  const { t } = useTranslation();

  const [domains, setDomains] = useState<{ id: number; name: string }[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/domains?limit=100")
      .then((res: any) => setDomains(res.data.data.domains || res.data.data))
      .catch(() => toast.error("Failed to load domains"))
      .finally(() => setDomainsLoading(false));
  }, []);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [github_url, setGithubUrl] = useState(initialData?.github_url || "");
  const [live_url, setLiveUrl] = useState(initialData?.live_url || "");
  const [figma_url, setFigmaUrl] = useState(initialData?.figma_url || "");

  const [selectedDomainId, setSelectedDomainId] = useState<number | "">(
    initialData?.domain_id || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId) {
      toast.error(t("projects.requireDomain", "Please select a domain"));
      return;
    }
    onSubmit({
      title,
      description,
      github_url: (github_url.trim() || (initialData ? null : undefined)) as any,
      live_url: (live_url.trim() || (initialData ? null : undefined)) as any,
      figma_url: (figma_url.trim() || (initialData ? null : undefined)) as any,
      domain_id: Number(selectedDomainId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">{t("common.name")} *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("projects.titlePlaceholder")}
            required
            dir="auto"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{t("common.description")} *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("projects.descPlaceholder")}
            required
            className="min-h-[100px]"
            dir="auto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL</Label>
          <Input
            id="github_url"
            type="url"
            value={github_url}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="live_url">Live URL</Label>
          <Input
            id="live_url"
            type="url"
            value={live_url}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="figma_url">Figma URL</Label>
          <Input
            id="figma_url"
            type="url"
            value={figma_url}
            onChange={(e) => setFigmaUrl(e.target.value)}
            placeholder="https://figma.com/..."
            dir="ltr"
          />
        </div>

        <div className="space-y-2 sm:col-span-2 mt-2">
          <Label>{t("projects.domain", "Project Domain")} *</Label>
          {domainsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading domains...
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value ? Number(e.target.value) : "")}
                className="w-full appearance-none rounded-xl border bg-card p-2.5 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="" disabled>
                  {t("projects.selectDomain", "Select a domain...")}
                </option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button asChild variant="outline" type="button">
          {initialData?.id ? (
            <Link to="/dashboard/projects/$id" params={{ id: String(initialData.id) }}>
              {t("common.cancel")}
            </Link>
          ) : (
            <Link to="/dashboard/projects">{t("common.cancel")}</Link>
          )}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          <Save className="h-4 w-4" />
          {submitLabel || t("common.save")}
        </Button>
      </div>
    </form>
  );
}
