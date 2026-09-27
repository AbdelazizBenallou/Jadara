import { Link } from "@tanstack/react-router";
import { Link2, Plus, FileText, X, Edit2, Trash2, Lightbulb, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable, type Column } from "@/components/table/DataTable";
import { TableFilters } from "@/components/table/TableFilters";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/common/FileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SkillDict {
  id: number;
  name: string;
}

export interface UserSkill {
  id: number;
  skill_id: number;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  skills?: { name: string };
  name?: string;
}

export function SkillsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [skillDict, setSkillDict] = useState<SkillDict[]>([]);
  const [domains, setDomains] = useState<{ id: number; name: string }[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | "">("");

  // We allow adding multiple skills at once before submitting
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [openSkillsDropdown, setOpenSkillsDropdown] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, dictRes, domainsRes] = await Promise.all([
        apiClient.get("/users/me/skills"),
        apiClient.get("/skills?limit=1000"),
        apiClient.get("/domains?limit=100"),
      ]);
      setSkills(userRes.data?.data || []);
      setSkillDict(dictRes.data?.data || []);
      setDomains(domainsRes.data?.data || []);
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [editFor, setEditFor] = useState<UserSkill | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Auto-open Add Skill if coming from Onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add-skill") {
      setAddOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [editSkillName, setEditSkillName] = useState("");
  const [editSkillLevel, setEditSkillLevel] = useState<UserSkill["level"]>("beginner");

  const resetAddForm = () => {
    setSelectedSkillIds([]);
    setSelectedDomainId("");
  };

  const mappedSkills = skills.map((s) => ({
    id: s.skill_id,
    skill_id: s.skill_id,
    name: s.skills?.name || skillDict.find((d) => d.id === s.skill_id)?.name || "Unknown",
    level: s.level,
  }));
  const rows = mappedSkills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkillIds.length === 0) return;
    try {
      const payload = selectedSkillIds.map((id) => ({ skill_id: id, level: "beginner" }));
      await apiClient.post("/users/me/skills", {
        skills: payload,
      });
      toast.success(t("common.saved"));
      fetchSkills();
      resetAddForm();
      setAddOpen(false);
    } catch (err) {
      toast.error(t("common.error"));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFor) return;
    try {
      await apiClient.patch(`/users/me/skills/${editFor.id}`, { level: editSkillLevel });
      toast.success(t("common.saved"));
      fetchSkills();
      setEditFor(null);
    } catch (err) {
      toast.error(t("common.error"));
    }
  };

  const renderSkillActions = (s: UserSkill) => {
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditFor(s);
            setEditSkillName(s.name || "");
            setEditSkillLevel(s.level);
          }}
          title={t("common.edit")}
          aria-label={t("common.edit")}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDeleteConfirmId(s.id)}
          title={t("common.delete")}
          aria-label={t("common.delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  const columns: Column<UserSkill>[] = [
    {
      key: "name",
      header: t("skills.skillName"),
      render: (s) => (
        <span className="font-semibold" dir="auto">
          {s.name}
        </span>
      ),
    },
    {
      key: "level",
      header: t("common.level"),
      render: (s) => t(`common.${s.level}`),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: renderSkillActions,
    },
  ];

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("skills.title")}
      subtitle={t("skills.subtitle")}
      actions={
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> {t("skills.addSkill")}
        </Button>
      }
    >
      <TableFilters search={search} onSearch={setSearch} selects={[]} />
      {/* Desktop View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyTitle={skills.length === 0 ? t("skills.emptyTitle") : t("skills.noSearchResults")}
          emptyDesc={skills.length === 0 ? t("skills.emptyDesc") : ""}
        />
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-card p-4 h-32" />
          ))
        ) : rows.length === 0 ? (
          <EmptyState
            title={skills.length === 0 ? t("skills.emptyTitle") : t("skills.noSearchResults")}
            description={skills.length === 0 ? t("skills.emptyDesc") : ""}
          />
        ) : (
          rows.map((s) => {
            return (
              <div
                key={s.id}
                className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-base" dir="auto">
                      {s.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {t(`common.${s.level}`)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex flex-wrap gap-2">{renderSkillActions(s)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Skill Dialog — taxonomy-based */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) {
            resetAddForm();
            setAddOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("skills.addSkill")}</DialogTitle>
            <DialogDescription>{t("skills.addSkillDesc")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t("skills.domainFilter", "Filter by Domain")}</Label>
              <div className="relative">
                <select
                  value={selectedDomainId}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setSelectedDomainId(val ? Number(val) : "");
                    if (val) {
                      try {
                        const res = await apiClient.get(`/domains/${val}/skills`);
                        setSkillDict(res.data?.data || []);
                      } catch (err) {
                        toast.error("Failed to load domain skills");
                      }
                    } else {
                      const res = await apiClient.get("/skills?limit=1000");
                      setSkillDict(res.data?.data || []);
                    }
                  }}
                  className="w-full appearance-none rounded-xl border bg-card p-2 pe-8 text-sm"
                >
                  <option value="">{t("skills.allDomains", "All Domains")}</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("skills.selectSkills", "Select Skills")}</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSkillIds.map((id) => {
                  const s = skillDict.find((x) => x.id === id) || { name: "Unknown" };
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-1 text-sm py-1"
                    >
                      {s.name}
                      <XIcon
                        className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors"
                        onClick={() => setSelectedSkillIds((prev) => prev.filter((p) => p !== id))}
                      />
                    </Badge>
                  );
                })}
              </div>
              <Popover open={openSkillsDropdown} onOpenChange={setOpenSkillsDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSkillsDropdown}
                    className="w-full justify-between font-normal text-muted-foreground"
                  >
                    {t("projects.searchSkills", "Search skills...")}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("projects.searchSkills", "Search skills...")} />
                    <CommandList>
                      <CommandEmpty>{t("projects.noSkillsFound", "No skills found.")}</CommandEmpty>
                      <CommandGroup>
                        {skillDict.map((skill) => (
                          <CommandItem
                            key={skill.id}
                            value={skill.name}
                            onSelect={() => {
                              setSelectedSkillIds((prev) =>
                                prev.includes(skill.id)
                                  ? prev.filter((id) => id !== skill.id)
                                  : [...prev, skill.id],
                              );
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSkillIds.includes(skill.id) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {skill.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetAddForm();
                  setAddOpen(false);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={selectedSkillIds.length === 0}>
                {t("common.add")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Skill Dialog */}
      <Dialog open={!!editFor} onOpenChange={(o) => !o && setEditFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t("skills.skillName")}</Label>
              <Input value={editSkillName} readOnly dir="auto" className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>{t("common.level")}</Label>
              <div className="relative">
                <select
                  value={editSkillLevel}
                  onChange={(e) => setEditSkillLevel(e.target.value as UserSkill["level"])}
                  className="w-full appearance-none rounded-xl border bg-card p-2 pe-8 text-sm"
                >
                  <option value="beginner">{t("common.beginner")}</option>
                  <option value="intermediate">{t("common.intermediate")}</option>
                  <option value="advanced">{t("common.advanced")}</option>
                  <option value="expert">{t("common.expert")}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditFor(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Skill Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>{t("skills.deleteWarn")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (deleteConfirmId !== null) {
                  setIsDeleting(true);
                  await new Promise((r) => setTimeout(r, 400));
                  try {
                    await apiClient.delete(`/users/me/skills/${deleteConfirmId}`);
                    toast.success(t("common.deleted"));
                    fetchSkills();
                  } catch (err) {
                    toast.error(t("common.error"));
                  } finally {
                    setIsDeleting(false);
                    setDeleteConfirmId(null);
                  }
                }
              }}
            >
              {isDeleting ? "..." : t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
