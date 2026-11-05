import { Link } from "@tanstack/react-router";
import {
  Link2,
  Plus,
  FileText,
  X,
  Edit2,
  Trash2,
  Lightbulb,
  ChevronDown,
  Sparkles,
  Search,
  Filter,
  Check,
  ChevronsUpDown,
  X as XIcon,
  LayoutGrid,
  List,
  Layers,
  Award,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addMySkills,
  getDomainSkills,
  getMySkills,
  listSkills,
  removeMySkill,
  updateMySkill,
} from "@/api/skills";
import { listDomains } from "@/api/domains";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import type { Skill, UserSkill } from "@/types/skill";
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
import { cn } from "@/lib/utils";

export function SkillsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<number | "">("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Multi-skill selection
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [openSkillsDropdown, setOpenSkillsDropdown] = useState(false);

  const skillsQuery = useQuery({
    queryKey: queryKeys.skills.mine,
    queryFn: getMySkills,
  });
  const skillDictQuery = useQuery({
    queryKey: queryKeys.skills.list({ limit: 1000 }),
    queryFn: () => listSkills({ limit: 1000 }),
  });
  const domainsQuery = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });
  const domainSkillsQuery = useQuery({
    queryKey: queryKeys.domains.skills(selectedDomainId || "none"),
    queryFn: () => getDomainSkills(selectedDomainId as number),
    enabled: selectedDomainId !== "",
  });

  const skills = skillsQuery.data ?? [];
  const skillDict = skillDictQuery.data ?? [];
  const domains = domainsQuery.data ?? [];
  const loading = skillsQuery.isLoading || skillDictQuery.isLoading || domainsQuery.isLoading;

  const domainSkillIds =
    selectedDomainId === ""
      ? null
      : (domainSkillsQuery.data ?? []).map((skill) => skill.id);

  useEffect(() => {
    const queryError =
      skillsQuery.error ?? skillDictQuery.error ?? domainsQuery.error ?? domainSkillsQuery.error;
    if (queryError) {
      notifyError(queryError, "common.error");
    }
  }, [
    skillsQuery.error,
    skillDictQuery.error,
    domainsQuery.error,
    domainSkillsQuery.error,
  ]);

  const invalidateSkills = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.skills.mine });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.beneficiary });
  };

  const addMutation = useMutation({
    mutationFn: addMySkills,
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Skills saved successfully!" }));
      invalidateSkills();
      resetAddForm();
      setAddOpen(false);
    },
    onError: (error) => notifyError(error, "common.error"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, level }: { id: number; level: UserSkill["level"] }) =>
      updateMySkill(id, { level }),
    onSuccess: () => {
      toast.success(t("common.saved", { defaultValue: "Skill level updated!" }));
      invalidateSkills();
      setEditFor(null);
    },
    onError: (error) => notifyError(error, "common.error"),
  });

  const deleteMutation = useMutation({
    mutationFn: removeMySkill,
    onSuccess: () => {
      toast.success(t("common.deleted", { defaultValue: "Skill removed successfully!" }));
      invalidateSkills();
    },
    onError: (error) => notifyError(error, "common.error"),
    onSettled: () => setDeleteConfirmId(null),
  });

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

  const mappedSkills = useMemo(() => {
    return skills.map((s) => ({
      id: s.skill_id,
      userSkillId: s.id,
      skill_id: s.skill_id,
      name: s.skills?.name || skillDict.find((d) => d.id === s.skill_id)?.name || "Skill",
      level: s.level,
      category: skillDict.find((d) => d.id === s.skill_id)?.category?.name || null,
      raw: s,
    }));
  }, [skills, skillDict]);

  const filteredSkills = useMemo(() => {
    return mappedSkills.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesDomain =
        domainSkillIds === null || domainSkillIds.includes(s.skill_id);
      return matchesSearch && matchesDomain;
    });
  }, [mappedSkills, search, domainSkillIds]);

  // Statistics Breakdown
  const stats = useMemo(() => {
    const total = skills.length;
    const beginner = skills.filter((s) => (s.level || "").toLowerCase() === "beginner").length;
    const intermediate = skills.filter((s) => (s.level || "").toLowerCase() === "intermediate").length;
    const advanced = skills.filter(
      (s) =>
        (s.level || "").toLowerCase() === "advanced" ||
        (s.level || "").toLowerCase() === "expert",
    ).length;
    return { total, beginner, intermediate, advanced };
  }, [skills]);

  const visibleSkills = domainSkillIds
    ? skillDict.filter((s) => domainSkillIds.includes(s.id))
    : skillDict;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkillIds.length === 0) return;
    const payload = selectedSkillIds.map((id) => ({
      skill_id: id,
      level: "beginner" as const,
    }));
    addMutation.mutate(payload);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFor) return;
    editMutation.mutate({ id: editFor.id, level: editSkillLevel });
  };

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("skills.title", { defaultValue: "My Skills" })}
      subtitle={t("skills.subtitle", { defaultValue: "Manage your technical competencies, proficiency levels, and registered skill tags." })}
      actions={
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{t("skills.addSkill", { defaultValue: "Add Skills" })}</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* ── Summary Metrics Row (Strictly NO tinted boxes) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-[#7135E8]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.total}</p>
                <p className="text-xs text-[#6C757D]">Total Skills</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-[#16A34A]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.advanced}</p>
                <p className="text-xs text-[#6C757D]">Advanced / Expert</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-[#0D6EFD]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.intermediate}</p>
                <p className="text-xs text-[#6C757D]">Intermediate</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Lightbulb className="h-5 w-5 text-[#F5B51B]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{stats.beginner}</p>
                <p className="text-xs text-[#6C757D]">Beginner / Learning</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#E9ECEF] bg-white p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADB5BD]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="ps-9 border-[#E9ECEF] text-xs h-9 bg-white"
              />
            </div>

            {/* Domain Filter */}
            <div className="relative w-full sm:w-48">
              <select
                value={selectedDomainId}
                onChange={(e) =>
                  setSelectedDomainId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full appearance-none rounded-lg border border-[#E9ECEF] bg-white py-1.5 ps-3 pe-8 text-xs font-semibold text-[#212529] outline-none h-9"
              >
                <option value="">{t("skills.allDomains", { defaultValue: "All Domains" })}</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-2.5 top-2.5 h-4 w-4 text-[#6C757D]" />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-[#E9ECEF] rounded-lg p-0.5 bg-[#F8F9FA]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded p-1.5 text-xs transition-colors",
                viewMode === "grid" ? "bg-white text-[#7135E8] shadow-xs font-bold" : "text-[#6C757D]",
              )}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded p-1.5 text-xs transition-colors",
                viewMode === "table" ? "bg-white text-[#7135E8] shadow-xs font-bold" : "text-[#6C757D]",
              )}
              title="Table View"
              aria-label="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Skills Content ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[#E9ECEF] bg-white p-5 h-28" />
            ))}
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
            <Sparkles className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
            <h3 className="text-base font-bold text-[#212529]">
              {skills.length === 0
                ? t("skills.emptyTitle", { defaultValue: "No skills registered yet" })
                : "No matching skills found"}
            </h3>
            <p className="text-xs text-[#6C757D] mt-1 max-w-sm mx-auto">
              {skills.length === 0
                ? "Add skills to highlight your competencies, qualify for volunteer activities, and attract companies."
                : "Try adjusting your search keyword or clearing the domain filter."}
            </p>
            <div className="mt-5">
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>{t("skills.addSkill", { defaultValue: "Add Skills" })}</span>
              </Button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSkills.map((s) => (
              <div
                key={s.userSkillId}
                className="flex flex-col justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs hover:border-[#7135E8] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#212529]" dir="auto">
                      {s.name}
                    </h4>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase shrink-0",
                        s.level === "expert" || s.level === "advanced"
                          ? "bg-white text-[#16A34A] border border-[#16A34A]"
                          : s.level === "intermediate"
                          ? "bg-white text-[#0D6EFD] border border-[#0D6EFD]"
                          : "bg-white text-[#6C757D] border border-[#E9ECEF]",
                      )}
                    >
                      {t(`common.${s.level}`, { defaultValue: s.level })}
                    </span>
                  </div>

                  {s.category && (
                    <p className="text-xs text-[#6C757D] mt-1.5">{s.category}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-[#E9ECEF] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditFor(s.raw);
                      setEditSkillName(s.name);
                      setEditSkillLevel(s.level);
                    }}
                    className="rounded p-1.5 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#7135E8] transition-colors"
                    title={t("common.edit", { defaultValue: "Edit Level" })}
                    aria-label="Edit Level"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(s.userSkillId)}
                    className="rounded p-1.5 text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors"
                    title={t("common.delete", { defaultValue: "Remove Skill" })}
                    aria-label="Remove Skill"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#6C757D] font-bold uppercase tracking-wider border-b border-[#E9ECEF]">
                <tr>
                  <th className="px-5 py-3.5">{t("skills.skillName", { defaultValue: "Skill" })}</th>
                  <th className="px-5 py-3.5">{t("admin.category", { defaultValue: "Category" })}</th>
                  <th className="px-5 py-3.5">{t("common.level", { defaultValue: "Level" })}</th>
                  <th className="px-5 py-3.5 text-right">{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {filteredSkills.map((s) => (
                  <tr key={s.userSkillId} className="hover:bg-[#F8F9FA]/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#212529]" dir="auto">
                      {s.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#6C757D]">
                      {s.category || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-[#F8F9FA] border border-[#E9ECEF] px-2 py-0.5 text-[10px] font-bold text-[#495057] uppercase">
                        {t(`common.${s.level}`, { defaultValue: s.level })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditFor(s.raw);
                            setEditSkillName(s.name);
                            setEditSkillLevel(s.level);
                          }}
                          className="rounded p-1.5 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#7135E8]"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(s.userSkillId)}
                          className="rounded p-1.5 text-[#DC3545] hover:bg-[#DC3545]/10"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Skill Dialog ─────────────────────────────────── */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) {
            resetAddForm();
            setAddOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md bg-white border-[#E9ECEF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#212529]">
              {t("skills.addSkill", { defaultValue: "Add Skills to Profile" })}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6C757D]">
              {t("skills.addSkillDesc", { defaultValue: "Select skills from the JADARA taxonomy to register in your dossier." })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("skills.domainFilter", { defaultValue: "Filter by Domain" })}
              </Label>
              <div className="relative">
                <select
                  value={selectedDomainId}
                  onChange={(e) => {
                    setSelectedDomainId(e.target.value ? Number(e.target.value) : "");
                  }}
                  className="w-full appearance-none rounded-xl border border-[#E9ECEF] bg-white p-2.5 pe-8 text-xs text-[#212529] outline-none"
                >
                  <option value="">{t("skills.allDomains", { defaultValue: "All Domains" })}</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-3 h-4 w-4 text-[#6C757D]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("skills.selectSkills", { defaultValue: "Select Skills" })}
              </Label>

              {/* Selected Pills */}
              {selectedSkillIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto p-1">
                  {selectedSkillIds.map((id) => {
                    const s = skillDict.find((x) => x.id === id) || { name: "Unknown", category: null };
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1 text-xs py-1 px-2.5 bg-[#F8F9FA] text-[#212529] border border-[#E9ECEF]"
                      >
                        <span>{s.name}</span>
                        <XIcon
                          className="h-3 w-3 cursor-pointer text-[#6C757D] hover:text-[#DC3545] transition-colors"
                          onClick={() => setSelectedSkillIds((prev) => prev.filter((p) => p !== id))}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}

              <Popover open={openSkillsDropdown} onOpenChange={setOpenSkillsDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSkillsDropdown}
                    className="w-full justify-between font-normal text-xs border-[#E9ECEF] text-[#6C757D] bg-white"
                  >
                    <span>
                      {selectedSkillIds.length > 0
                        ? `${selectedSkillIds.length} skills selected`
                        : t("projects.searchSkills", { defaultValue: "Search skills in directory..." })}
                    </span>
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0 bg-white border-[#E9ECEF]" align="start">
                  <Command>
                    <CommandInput placeholder="Search skills..." className="text-xs" />
                    <CommandList>
                      <CommandEmpty className="p-3 text-xs text-center text-[#6C757D]">
                        No matching skills found.
                      </CommandEmpty>
                      <CommandGroup>
                        {visibleSkills.map((skill) => (
                          <CommandItem
                            key={skill.id}
                            value={`${skill.name} ${skill.category?.name || ""}`}
                            onSelect={() => {
                              setSelectedSkillIds((prev) =>
                                prev.includes(skill.id)
                                  ? prev.filter((id) => id !== skill.id)
                                  : [...prev, skill.id],
                              );
                            }}
                            className="text-xs cursor-pointer hover:bg-[#F8F9FA]"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5 text-[#7135E8]",
                                selectedSkillIds.includes(skill.id) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="flex flex-1 items-center justify-between gap-2">
                              <span dir="auto">{skill.name}</span>
                              {skill.category?.name ? (
                                <span className="text-[10px] text-[#6C757D]">
                                  {skill.category.name}
                                </span>
                              ) : null}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetAddForm();
                  setAddOpen(false);
                }}
                className="border-[#E9ECEF] text-xs text-[#6C757D]"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                disabled={selectedSkillIds.length === 0 || addMutation.isPending}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold"
              >
                {addMutation.isPending
                  ? "Adding..."
                  : `${t("common.add", { defaultValue: "Add" })} (${selectedSkillIds.length})`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Skill Dialog ────────────────────────────────── */}
      <Dialog open={!!editFor} onOpenChange={(o) => !o && setEditFor(null)}>
        <DialogContent className="max-w-md bg-white border-[#E9ECEF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#212529]">
              {t("common.edit", { defaultValue: "Update Proficiency Level" })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("skills.skillName", { defaultValue: "Skill" })}
              </Label>
              <Input
                value={editSkillName}
                readOnly
                dir="auto"
                className="bg-[#F8F9FA] border-[#E9ECEF] text-xs font-bold text-[#212529]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#212529]">
                {t("common.level", { defaultValue: "Proficiency Level" })}
              </Label>
              <div className="relative">
                <select
                  value={editSkillLevel}
                  onChange={(e) => setEditSkillLevel(e.target.value as UserSkill["level"])}
                  className="w-full appearance-none rounded-xl border border-[#E9ECEF] bg-white p-2.5 pe-8 text-xs text-[#212529] outline-none"
                >
                  <option value="beginner">{t("common.beginner", { defaultValue: "Beginner" })}</option>
                  <option value="intermediate">{t("common.intermediate", { defaultValue: "Intermediate" })}</option>
                  <option value="advanced">{t("common.advanced", { defaultValue: "Advanced" })}</option>
                  <option value="expert">{t("common.expert", { defaultValue: "Expert" })}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-3 h-4 w-4 text-[#6C757D]" />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditFor(null)}
                className="border-[#E9ECEF] text-xs text-[#6C757D]"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                disabled={editMutation.isPending}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold"
              >
                {editMutation.isPending ? "Saving..." : t("common.save", { defaultValue: "Save Changes" })}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Skill Confirmation Dialog ─────────────────── */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm bg-white border-[#E9ECEF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#212529]">
              {t("common.delete", { defaultValue: "Remove Skill" })}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6C757D]">
              {t("skills.deleteWarn", { defaultValue: "Are you sure you want to remove this skill from your profile?" })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteMutation.isPending}
              className="border-[#E9ECEF] text-xs text-[#6C757D]"
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteConfirmId !== null) {
                  deleteMutation.mutate(deleteConfirmId);
                }
              }}
              className="text-xs font-semibold"
            >
              {deleteMutation.isPending ? "..." : t("common.delete", { defaultValue: "Remove" })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
