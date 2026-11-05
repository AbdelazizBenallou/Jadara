import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Edit,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  User,
  Sparkles,
  FolderOpen,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { generatePdf, getPdfStatus } from "@/api/cv";
import { listProjects } from "@/api/projects";
import { getMySkills } from "@/api/skills";
import {
  getMyProfile,
  listCertifications,
  listEducation,
  listMyLanguages,
  listWorkExperience,
} from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import type { PdfStatus } from "@/types/cv";
import type { UserProfile } from "@/types/user";

import { WorkExperienceSection } from "./components/WorkExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { LanguagesSection } from "./components/LanguagesSection";

export function CvBuilderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<PdfStatus | null>(null);

  const cvQuery = useQuery({
    queryKey: queryKeys.cv.data,
    queryFn: async () => {
      const [profile, skills, projects, workExperience, education, certifications, languages] =
        await Promise.all([
          getMyProfile(),
          getMySkills(),
          listProjects(),
          listWorkExperience(),
          listEducation(),
          listCertifications(),
          listMyLanguages(),
        ]);
      return {
        profile: profile.profile as UserProfile | null,
        skills,
        projects,
        workExperience,
        education,
        certifications,
        languages,
      };
    },
  });

  const pdfQuery = useQuery({
    queryKey: queryKeys.cv.pdfStatus,
    queryFn: () => getPdfStatus(true),
  });

  useEffect(() => {
    const statusList = pdfQuery.data?.languages ?? [];
    setPdfStatus(statusList.find((item) => item.language === "EN") ?? statusList[0] ?? null);
  }, [pdfQuery.data]);

  useEffect(() => {
    const error = cvQuery.error ?? pdfQuery.error;
    if (error) notifyError(error, "common.error");
  }, [cvQuery.error, pdfQuery.error]);

  const profile = cvQuery.data?.profile ?? null;
  const skills = cvQuery.data?.skills ?? [];
  const projects = cvQuery.data?.projects ?? [];
  const workExperience = cvQuery.data?.workExperience ?? [];
  const education = cvQuery.data?.education ?? [];
  const certifications = cvQuery.data?.certifications ?? [];
  const languages = cvQuery.data?.languages ?? [];
  const loading = cvQuery.isLoading;

  const refreshCvData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cv.data });
  }, [queryClient]);

  const pollPdfStatus = useCallback(
    async (remaining = 15) => {
      for (let i = 0; i < remaining; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const data = await getPdfStatus(true);
          const status =
            data.languages.find((item) => item.language === "EN") ??
            data.languages[0];
          if (!status) continue;

          setPdfStatus(status);

          if (status.status === "completed" && status.download_url) {
            toast.success(t("cv.generated", { defaultValue: "Your CV PDF is ready for download!" }));
            refreshCvData();
            return;
          }
          if (status.status === "failed") {
            toast.error(status.error_message || t("error.desc", { defaultValue: "Failed to generate CV." }));
            return;
          }
        } catch {
          // Ignore transient polling errors.
        }
      }
    },
    [refreshCvData, t],
  );

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const data = await generatePdf();
      const ready = data.jobs.find(
        (job) => job.status === "completed" && job.download_url,
      );

      if (ready) {
        setPdfStatus({
          status: "completed",
          download_url: ready.download_url,
          language: ready.language,
        });
        toast.success(t("cv.generated", { defaultValue: "Your CV PDF is ready for download!" }));
        refreshCvData();
      } else {
        setPdfStatus({ status: "queued" });
        toast.success(t("cv.generating", { defaultValue: "Generating your CV PDF..." }));
        await pollPdfStatus();
      }
    } catch (error) {
      notifyError(error, "error.desc");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        role="beneficiary"
        title={t("cv.title", { defaultValue: "CV Builder" })}
        subtitle="Manage sections and generate your professional JADARA resume."
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#E9ECEF] bg-white p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#7135E8]" />
          <p className="mt-3 text-xs font-semibold text-[#6C757D]">
            Loading your dossier sections...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Completeness checks
  const readinessChecks = [
    { label: t("cv.personalInfo", { defaultValue: "Personal & Contact Details" }), complete: !!profile?.first_name && !!profile?.location },
    { label: t("cv.profSummary", { defaultValue: "Professional Summary" }), complete: !!profile?.bio },
    { label: t("sidebar.skills", { defaultValue: "Registered Skills" }), complete: skills.length > 0 },
    { label: t("exp.work", { defaultValue: "Work Experience" }), complete: workExperience.length > 0 },
    { label: t("profile.educationLevel", { defaultValue: "Education History" }), complete: education.length > 0 },
    { label: t("domain.language", { defaultValue: "Languages Spoken" }), complete: languages.length > 0 },
    { label: t("exp.projects", { defaultValue: "Verified Projects" }), complete: projects.length > 0 },
    { label: t("docs.certificate", { defaultValue: "Certifications" }), complete: certifications.length > 0 },
  ];

  const score = Math.round(
    (readinessChecks.filter((c) => c.complete).length / readinessChecks.length) * 100,
  );

  const status = pdfStatus?.status as string | undefined;
  const isGenerated = status === "completed" && !!pdfStatus?.download_url;
  const isInProgress = status === "queued" || status === "processing";
  const isFailed = status === "failed";

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("cv.title", { defaultValue: "CV Builder" })}
      subtitle={t("cv.subtitle", { defaultValue: "Curate your professional experience, qualifications, and export your official JADARA resume." })}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── CV Actions & Readiness Header Card ─── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Circular Gauge */}
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-[#F8F9FA] border border-[#E9ECEF]">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#E9ECEF"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#7135E8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="175.9"
                  strokeDashoffset={175.9 - (175.9 * score) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="text-sm font-black text-[#212529] z-10">
                {score}%
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#212529]">
                {t("cv.cvReadiness", { defaultValue: "CV Readiness Score" })}
              </h3>
              {isInProgress ? (
                <p className="text-xs text-[#7135E8] font-semibold mt-0.5 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{t("cv.generating", { defaultValue: "Compiling your PDF..." })}</span>
                </p>
              ) : isFailed ? (
                <p className="text-xs text-[#DC3545] font-semibold mt-0.5">
                  {pdfStatus?.error_message || "Generation error. Please retry."}
                </p>
              ) : isGenerated ? (
                <p className="text-xs text-[#16A34A] font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Your resume is ready for download</span>
                </p>
              ) : (
                <p className="text-xs text-[#6C757D] mt-0.5">
                  Complete your sections to build an impressive profile. All fields are optional.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {isGenerated && (
              <Button asChild variant="outline" className="border-[#E9ECEF] text-xs font-semibold gap-2 text-[#212529] hover:bg-[#F8F9FA]">
                <a
                  href={pdfStatus.download_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 text-[#7135E8]" />
                  <span>{t("cv.downloadPdf", { defaultValue: "Download PDF" })}</span>
                </a>
              </Button>
            )}
            <Button
              onClick={handleGeneratePdf}
              disabled={generating || isInProgress}
              className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-2 shadow-xs"
            >
              {generating || isInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isGenerated ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>
                {isInProgress
                  ? "Generating…"
                  : isFailed
                  ? "Retry Generation"
                  : isGenerated
                  ? "Regenerate PDF"
                  : "Generate CV PDF"}
              </span>
            </Button>
          </div>
        </div>

        {/* ── Completeness Criteria Checklist ── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {readinessChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-[#ADB5BD] shrink-0" />
                )}
                <span className={cn(check.complete ? "font-semibold text-[#212529]" : "text-[#6C757D]")}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Personal Info & Bio Preview Card ── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#7135E8]" />
              <h3 className="text-base font-bold text-[#212529]">
                {t("cv.personalInfo", { defaultValue: "Personal & Contact Information" })}
              </h3>
            </div>
            <Link
              to="/dashboard/profile"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7135E8] hover:underline"
            >
              <Edit className="h-3 w-3" />
              <span>{t("cv.editProfile", { defaultValue: "Edit in Profile" })}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-b border-[#E9ECEF] pb-4">
            <div>
              <span className="text-[#6C757D] block mb-0.5">{t("cv.name", { defaultValue: "Full Name" })}</span>
              <span className="font-bold text-[#212529]">
                {profile?.first_name || profile?.last_name
                  ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
                  : user?.name || "—"}
              </span>
            </div>
            <div>
              <span className="text-[#6C757D] block mb-0.5">{t("cv.phone", { defaultValue: "Phone Number" })}</span>
              <span className="font-medium text-[#212529]" dir="ltr">
                {profile?.phone || "—"}
              </span>
            </div>
            <div>
              <span className="text-[#6C757D] block mb-0.5">{t("cv.location", { defaultValue: "Wilaya / Location" })}</span>
              <span className="font-medium text-[#212529]">
                {profile?.location || "—"}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <h4 className="text-xs font-bold text-[#212529] mb-1.5">
              {t("cv.profSummary", { defaultValue: "Professional Summary" })}
            </h4>
            {profile?.bio ? (
              <p className="text-xs text-[#6C757D] leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs text-[#6C757D] italic">
                {t("cv.noSummary", { defaultValue: "No summary added yet. Introduce yourself in your profile." })}
              </p>
            )}
          </div>
        </div>

        {/* ── Main Subsections ── */}
        <WorkExperienceSection onUpdate={refreshCvData} />
        <EducationSection onUpdate={refreshCvData} />
        <LanguagesSection onUpdate={refreshCvData} />
        <CertificationsSection onUpdate={refreshCvData} />

        {/* ── Registered Skills Preview Card ── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7135E8]" />
              <h3 className="text-base font-bold text-[#212529]">
                {t("sidebar.skills", { defaultValue: "Registered Skills" })}
              </h3>
            </div>
            <Link
              to="/dashboard/skills"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7135E8] hover:underline"
            >
              <Edit className="h-3 w-3" />
              <span>{t("cv.editSkills", { defaultValue: "Manage Skills" })}</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.map((s) => (
                <span
                  key={s.skill_id}
                  className="rounded-lg border border-[#E9ECEF] bg-white px-3 py-1.5 text-xs font-semibold text-[#212529]"
                >
                  {s.name || s.skills?.name}{" "}
                  <span className="text-[#6C757D] font-normal ml-1 uppercase text-[10px]">
                    ({s.level})
                  </span>
                </span>
              ))
            ) : (
              <p className="text-xs text-[#6C757D] italic">
                {t("cv.noSkills", { defaultValue: "No skills registered yet." })}
              </p>
            )}
          </div>
        </div>

        {/* ── Verified Projects Preview Card ── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[#7135E8]" />
              <h3 className="text-base font-bold text-[#212529]">
                {t("exp.projects", { defaultValue: "Projects & Portfolio" })}
              </h3>
            </div>
            <Link
              to="/dashboard/projects"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7135E8] hover:underline"
            >
              <span>{t("cv.manage", { defaultValue: "View All Projects" })}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[#E9ECEF] bg-white p-3.5 hover:border-[#7135E8] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#212529]">{p.title}</p>
                    <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold text-[#6C757D] uppercase">
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-[#6C757D] mt-1 line-clamp-1">
                      {p.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#6C757D] italic">
                {t("cv.noProjects", { defaultValue: "No projects in portfolio yet." })}
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
