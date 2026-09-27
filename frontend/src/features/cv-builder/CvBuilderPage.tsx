import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Edit,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { WorkExperienceSection } from "./components/WorkExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { LanguagesSection } from "./components/LanguagesSection";

export function CvBuilderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // States for data & readiness
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [pdfStatus, setPdfStatus] = useState<any>(null);

  const fetchCvData = useCallback(async () => {
    try {
      const [profileRes, skillsRes, projectsRes, workRes, eduRes, certRes, langRes, pdfRes] =
        await Promise.all([
          apiClient.get("/users/me/profile"),
          apiClient.get("/users/me/skills"),
          apiClient.get("/projects"),
          apiClient.get("/users/me/work-experience"),
          apiClient.get("/users/me/education"),
          apiClient.get("/users/me/certifications"),
          apiClient.get("/users/me/languages"),
          apiClient.get("/users/me/pdf-status").catch(() => ({ data: { data: null } })),
        ]);

      setProfile(profileRes.data.data?.profiles || profileRes.data.data?.profile || {});
      setSkills(skillsRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setWorkExperience(workRes.data.data || []);
      setEducation(eduRes.data.data || []);
      setCertifications(certRes.data.data || []);
      setLanguages(langRes.data.data || []);
      setPdfStatus(pdfRes.data?.data);
    } catch (err) {
      toast.error(t("error.title"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCvData();
  }, [fetchCvData]);

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post("/users/me/pdf-generate");
      const { status, missing_fields } = res.data.data;

      if (status === "incomplete") {
        toast.error(`${t("cv.incompleteProfile")}${missing_fields.join(", ")}`);
      } else {
        toast.success(t("cv.generated"));
        fetchCvData(); // Refresh to get latest download URL
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error.desc"));
    } finally {
      setGenerating(false);
    }
  };



  if (loading) {
    return (
      <DashboardLayout role="beneficiary" title={t("cv.title")}>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // --- Readiness Calculation ---
  const readinessChecks = [
    { label: t("cv.personalInfo"), complete: !!profile?.first_name && !!profile?.location },
    { label: t("cv.profSummary"), complete: !!profile?.bio },
    { label: t("sidebar.skills"), complete: skills.length > 0, mandatory: true },
    { label: t("exp.work"), complete: workExperience.length > 0, mandatory: true },
    { label: t("profile.educationLevel"), complete: education.length > 0, mandatory: true },
    { label: t("domain.language"), complete: languages.length > 0, mandatory: true },
    { label: t("exp.projects"), complete: projects.length > 0 },
    { label: t("docs.certificate"), complete: certifications.length > 0 },
  ];

  const score = Math.round(
    (readinessChecks.filter((c) => c.complete).length / readinessChecks.length) * 100,
  );

  const missingMandatory = readinessChecks.some((c) => c.mandatory && !c.complete);
  const isGenerated = pdfStatus?.status === "completed" && pdfStatus?.download_url;

  return (
    <DashboardLayout role="beneficiary" title={t("cv.title")} subtitle={t("cv.subtitle")}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* CV Actions Header Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-card shadow-inner border border-muted/50">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted/30"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="175.9"
                  strokeDashoffset={175.9 - (175.9 * score) / 100}
                  className={cn("transition-all duration-1000 ease-out", score >= 100 ? "text-emerald-500" : "text-primary")}
                />
              </svg>
              <span
                className={cn("text-sm font-bold z-10", score >= 100 ? "text-emerald-600 dark:text-emerald-500" : "text-primary")}
              >
                {score}%
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg">{t("cv.cvReadiness")}</h3>
              {missingMandatory ? (
                <p className="text-sm text-destructive">{t("cv.missingMandatory")}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("cv.profileReady")}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!isGenerated ? (
              <Button
                onClick={handleGeneratePdf}
                disabled={generating || missingMandatory}
                className="gap-2"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {t("cv.generateCv")}
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <a href={pdfStatus.download_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  {t("cv.downloadPdf")}
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Readiness Breakdown */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <ul className="grid sm:grid-cols-2 gap-4 text-sm">
            {readinessChecks.map((check, i) => (
              <li key={i} className="flex items-center gap-2">
                {check.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : check.mandatory ? (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn(!check.complete && "text-muted-foreground")}>
                  {check.label} {check.mandatory && <span className="text-destructive">*</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Personal Info & Bio (Read-Only) */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{t("cv.personalInfo")}</h3>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-primary">
              <Link to="/dashboard/profile">
                <Edit className="h-3 w-3" /> {t("cv.editProfile")}
              </Link>
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">{t("cv.name")}</span>
              <span className="font-medium">
                {profile?.first_name || profile?.last_name
                  ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
                  : "—"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground block text-xs">{t("cv.phone")}</span>
                <span className="font-medium" dir="ltr">
                  {profile?.phone || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">{t("cv.location")}</span>
                <span className="font-medium">{profile?.location ? t(`wilayas.${profile.location}`) : "—"}</span>
              </div>
            </div>
          </div>

          <h3 className="font-bold mt-6 mb-2">{t("cv.profSummary")}</h3>
          {profile?.bio ? (
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("cv.noSummary")}</p>
          )}
        </div>

        {/* Main Sections */}
        <WorkExperienceSection onUpdate={fetchCvData} />
        <EducationSection onUpdate={fetchCvData} />
        <LanguagesSection onUpdate={fetchCvData} />
        <CertificationsSection onUpdate={fetchCvData} />

        {/* Skills (Read-Only) */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{t("sidebar.skills")}</h3>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-primary">
              <Link to="/dashboard/skills">
                <Edit className="h-3 w-3" /> {t("cv.editSkills")}
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium border"
                >
                  {s.skills?.name || s.name}{" "}
                  <span className="text-muted-foreground font-normal ml-1 capitalize">
                    ({s.level})
                  </span>
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">{t("cv.noSkills")}</p>
            )}
          </div>
        </div>

        {/* Projects (Read-Only) */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{t("exp.projects")}</h3>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-primary">
              <Link to="/dashboard/projects">
                {t("cv.manage")} <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.slice(0, 3).map((p) => (
                <div key={p.id} className="text-sm border-l-2 border-primary pl-3">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.status.replace("_", " ")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">{t("cv.noProjects")}</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
