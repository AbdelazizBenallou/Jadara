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
  HeartHandshake,
  User,
  FolderOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/api/projects";
import { getMySkills } from "@/api/skills";
import { getMyProfile } from "@/api/users";
import { getMyVolunteerApplications } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { Button } from "@/components/ui/button";

export function BeneficiaryDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.beneficiary,
    queryFn: async () => {
      const [projects, skills, profile, applications] = await Promise.all([
        listProjects(),
        getMySkills(),
        getMyProfile(),
        getMyVolunteerApplications().catch(() => ({ items: [] })),
      ]);
      return {
        projects,
        skills,
        profile,
        applications: (applications as any)?.items || (applications as any)?.data || [],
      };
    },
  });

  useEffect(() => {
    if (dashboardQuery.isError) {
      notifyError(dashboardQuery.error, "common.error");
    }
  }, [dashboardQuery.error, dashboardQuery.isError]);

  const projects = dashboardQuery.data?.projects ?? [];
  const skills = dashboardQuery.data?.skills ?? [];
  const profile = dashboardQuery.data?.profile ?? null;
  const applications = dashboardQuery.data?.applications ?? [];
  const loading = dashboardQuery.isLoading;

  const draftProjects = (projects as any[]).filter((p: any) => p.status === "draft");
  const verifiedProjects = (projects as any[]).filter((p: any) => p.status === "verified");
  const pendingProjects = (projects as any[]).filter((p: any) => p.status === "under_review");

  return (
    <DashboardLayout
      role="beneficiary"
      title={t("dash.welcome", { name: profile?.profile?.first_name || user?.name || "Beneficiary" })}
      subtitle={t("dash.sub", { defaultValue: "Your central workspace for skills, verified projects, and volunteering missions." })}
    >
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-[#E9ECEF] bg-white p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#7135E8]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Top Metric Highlights (NO tinted boxes) ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[#7135E8]" />
                <div>
                  <p className="text-xl font-bold text-[#212529]">{skills.length}</p>
                  <p className="text-xs text-[#6C757D]">Registered Skills</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Award className="h-5 w-5 text-[#16A34A]" />
                <div>
                  <p className="text-xl font-bold text-[#212529]">{verifiedProjects.length}</p>
                  <p className="text-xs text-[#6C757D]">Verified Projects</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="h-5 w-5 text-[#0D6EFD]" />
                <div>
                  <p className="text-xl font-bold text-[#212529]">{applications.length}</p>
                  <p className="text-xs text-[#6C757D]">Volunteering Missions</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="h-5 w-5 text-[#F5B51B]" />
                <div>
                  <p className="text-xl font-bold text-[#212529]">{pendingProjects.length}</p>
                  <p className="text-xs text-[#6C757D]">Under Review</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick Access Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Link
              to="/dashboard/applications"
              className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs hover:border-[#7135E8] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="h-5 w-5 text-[#7135E8]" />
                <div>
                  <h4 className="text-xs font-bold text-[#212529] group-hover:text-[#7135E8] transition-colors">
                    My Applications
                  </h4>
                  <p className="text-[11px] text-[#6C757D]">Track mission status</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#ADB5BD] group-hover:text-[#7135E8] transition-colors" />
            </Link>

            <Link
              to="/dashboard/skills"
              className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs hover:border-[#7135E8] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#7135E8]" />
                <div>
                  <h4 className="text-xs font-bold text-[#212529] group-hover:text-[#7135E8] transition-colors">
                    My Skills
                  </h4>
                  <p className="text-[11px] text-[#6C757D]">Manage proficiencies</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#ADB5BD] group-hover:text-[#7135E8] transition-colors" />
            </Link>

            <Link
              to="/dashboard/cv-builder"
              className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs hover:border-[#7135E8] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#7135E8]" />
                <div>
                  <h4 className="text-xs font-bold text-[#212529] group-hover:text-[#7135E8] transition-colors">
                    CV Builder
                  </h4>
                  <p className="text-[11px] text-[#6C757D]">Export professional PDF</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#ADB5BD] group-hover:text-[#7135E8] transition-colors" />
            </Link>

            <Link
              to="/dashboard/profile"
              className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs hover:border-[#7135E8] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-[#7135E8]" />
                <div>
                  <h4 className="text-xs font-bold text-[#212529] group-hover:text-[#7135E8] transition-colors">
                    My Profile
                  </h4>
                  <p className="text-[11px] text-[#6C757D]">Identity & presence</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#ADB5BD] group-hover:text-[#7135E8] transition-colors" />
            </Link>
          </div>

          {/* ── Main Content Columns ── */}
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Project Verification Pipeline */}
            <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#212529]">
                    {t("dash.projectStatus", { defaultValue: "Project Verification Status" })}
                  </h2>
                  <p className="text-xs text-[#6C757D]">Evidence submitted for reviewer evaluation</p>
                </div>
                <Link
                  to="/dashboard/projects"
                  className="text-xs font-bold text-[#7135E8] hover:underline"
                >
                  {t("dash.viewAll", { defaultValue: "View All" })} →
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Award className="h-4 w-4 text-[#16A34A]" />
                    <span className="text-xs font-bold text-[#212529]">
                      {t("dash.verified", { defaultValue: "Verified Projects" })}
                    </span>
                  </div>
                  <span className="text-base font-black text-[#16A34A]">{verifiedProjects.length}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-3.5">
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="h-4 w-4 text-[#F5B51B]" />
                    <span className="text-xs font-bold text-[#212529]">
                      {t("dash.underReview", { defaultValue: "Projects Under Review" })}
                    </span>
                  </div>
                  <span className="text-base font-black text-[#B45309]">{pendingProjects.length}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-3.5">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#6C757D]" />
                    <span className="text-xs font-bold text-[#212529]">
                      {t("dash.draft", { defaultValue: "Draft Projects" })}
                    </span>
                  </div>
                  <span className="text-base font-black text-[#6C757D]">{draftProjects.length}</span>
                </div>
              </div>
            </div>

            {/* Skills & Competencies */}
            <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#212529]">
                    {t("dash.recentSkills", { defaultValue: "Registered Skills" })}
                  </h2>
                  <p className="text-xs text-[#6C757D]">Technical competencies and proficiencies</p>
                </div>
                <Link
                  to="/dashboard/skills"
                  className="text-xs font-bold text-[#7135E8] hover:underline"
                >
                  {t("dash.viewAll", { defaultValue: "Manage" })} →
                </Link>
              </div>

              {skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E9ECEF] p-8 text-center">
                  <Sparkles className="h-8 w-8 text-[#ADB5BD] mb-2" />
                  <p className="text-xs text-[#6C757D] mb-3">{t("dash.emptySkills", { defaultValue: "No skills registered yet" })}</p>
                  <Link to="/dashboard/skills">
                    <Button size="sm" className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs">
                      {t("dash.addFirstSkill", { defaultValue: "Add Your Skills" })}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {skills.slice(0, 4).map((s: any) => (
                    <div
                      key={s.skill_id}
                      className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-3 hover:border-[#7135E8] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="h-4 w-4 text-[#7135E8]" />
                        <span className="text-xs font-bold text-[#212529]">
                          {s.name || s.skills?.name}
                        </span>
                      </div>
                      <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold text-[#6C757D] uppercase">
                        {s.level}
                      </span>
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
