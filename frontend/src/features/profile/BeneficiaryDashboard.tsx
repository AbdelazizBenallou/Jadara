import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Award,
  FileCheck2,
  ArrowRight,
  ClipboardCheck,
  Loader2,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { Project } from "@/types/project";

export function BeneficiaryDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<
    { id: number; skill_id: number; level: string; name?: string; skills?: { name: string } }[]
  >([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [pdfStatus, setPdfStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, skillRes, profileRes, workRes, eduRes, langRes, pdfRes] = await Promise.all(
          [
            apiClient.get("/projects"),
            apiClient.get("/users/me/skills"),
            apiClient.get("/users/me/profile"),
            apiClient.get("/users/me/work-experience"),
            apiClient.get("/users/me/education"),
            apiClient.get("/users/me/languages"),
            apiClient.get("/users/me/pdf-status").catch(() => ({ data: { data: null } })),
          ],
        );

        setProjects(projRes.data.data || []);
        setSkills(skillRes.data.data || []);
        setProfile(profileRes.data.data);
        setWorkExperience(workRes.data.data?.work_experience || []);
        setEducation(eduRes.data.data?.education || []);
        setLanguages(langRes.data.data?.languages || []);
        setPdfStatus(pdfRes.data?.data);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const draftProjects = projects.filter((p) => p.status === "draft");
  const verifiedProjects = projects.filter((p) => p.status === "verified");
  const pendingProjects = projects.filter((p) => p.status === "under_review");

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("dash.welcome", { name: profile?.first_name || user?.name || "" })}
      subtitle={t("dash.sub")}
    >
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              label={t("dash.skills")}
              value={skills.length}
            />
            <StatCard
              icon={<Award className="h-5 w-5" />}
              label={t("dash.verifiedProjects", { defaultValue: "Verified Projects" })}
              value={verifiedProjects.length}
            />
            <StatCard
              icon={<FileCheck2 className="h-5 w-5" />}
              label={t("dash.projectsUnderReview", { defaultValue: "Projects Under Review" })}
              value={pendingProjects.length}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Verification Summary */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{t("dash.projectStatus", { defaultValue: "Project Status" })}</h2>
                <Link
                  to="/dashboard/projects"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  {t("dash.viewAll")}
                </Link>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 p-4 transition-colors hover:bg-success/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("dash.verified", { defaultValue: "Verified" })}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-success">{verifiedProjects.length}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/5 p-4 transition-colors hover:bg-warning/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning-foreground">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("dash.underReview", { defaultValue: "Under Review" })}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-warning-foreground">{pendingProjects.length}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-muted bg-muted/20 p-4 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t("dash.draft", { defaultValue: "Draft" })}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-muted-foreground">{draftProjects.length}</p>
                </div>
              </div>
            </div>

            {/* Recent Skills */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{t("dash.recentSkills")}</h2>
                <Link
                  to="/dashboard/skills"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  {t("dash.viewAll")}
                </Link>
              </div>
              
              {skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{t("dash.emptySkills")}</p>
                  <Link to="/dashboard/skills" className="text-sm font-medium text-primary hover:underline">
                    {t("dash.addFirstSkill")}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {skills.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground" dir="auto">
                            {s.name || s.skills?.name}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {t(`common.${s.level.toLowerCase()}`, { defaultValue: s.level })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
