import { useState } from "react";
import { Link, useParams, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  Briefcase,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  Languages as LanguagesIcon,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SocialIcon } from "@/components/common/SocialIcon";
import { getPublicProfile } from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProfileTab = "overview" | "about" | "skills" | "projects" | "volunteering";

export function TalentProfile() {
  const { id } = useParams({ strict: false });
  const location = useLocation();
  const { t } = useTranslation();

  const isReviewer = location.pathname.startsWith("/reviewer");
  const role = isReviewer ? "reviewer" : "company";
  const backLink = isReviewer ? "/reviewer/queue" : "/company";
  const backLabel = isReviewer ? "Back to Verification Queue" : "Back to Talent Discovery";

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [hireOpen, setHireOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { data: talent, isLoading, isError } = useQuery({
    queryKey: queryKeys.users.profile(id ?? "none"),
    queryFn: () => getPublicProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout role={role} title="Talent Profile" backLink={backLink}>
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-[#E9ECEF] bg-white p-12">
          <Loader2 className="h-10 w-10 animate-spin text-[#7135E8]" />
          <p className="mt-3 text-xs font-semibold text-[#6C757D]">
            Loading talent dossier...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !talent) {
    return (
      <DashboardLayout role={role} title="Talent Profile" backLink={backLink}>
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
          <User className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
          <h2 className="text-lg font-bold text-[#212529]">Talent Profile Not Found</h2>
          <p className="mt-1 text-xs text-[#6C757D]">
            The talent profile you are looking for does not exist or is no longer available.
          </p>
          <div className="mt-4">
            <Link
              to={backLink as any}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel}</span>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const profile = talent.profiles;
  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || talent.email || "JADARA Professional";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "JA";

  const avatar = profile?.avatar_url;
  const coverUrl =
    profile?.cover_url ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80";

  const headline =
    profile?.headline ||
    talent.work_experiences?.[0]?.job_title ||
    "Verified Professional";

  const skills = talent.user_skills || [];
  const projects = talent.projects || [];
  const languages = talent.user_languages || [];
  const socials = talent.user_socials || [];
  const volunteerApps = talent.volunteer_applications || [];
  const workExperiences = talent.work_experiences || [];
  const educations = talent.educations || [];
  const certifications = talent.certifications || [];

  const navTabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "about", label: "About & Contact", icon: User },
    { id: "skills", label: "Skills & Qualifications", icon: Sparkles, badge: skills.length },
    { id: "projects", label: "Projects & Portfolio", icon: FolderKanban, badge: projects.length },
    { id: "volunteering", label: "Volunteering Experience", icon: HeartHandshake, badge: volunteerApps.length },
  ];

  return (
    <DashboardLayout role={role} title={fullName} backLink={backLink}>
      <div className="space-y-6">
        {/* Breadcrumb back link */}
        <div className="flex items-center justify-between">
          <Link
            to={backLink as any}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7135E8] hover:text-[#5a2ab8] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>

          <span className="text-xs font-mono font-bold text-[#6C757D] bg-white px-2.5 py-1 rounded-lg border border-[#E9ECEF]">
            Talent ID #{talent.id}
          </span>
        </div>

        {/* ── Section 1: Facebook-Inspired Header & Cover Banner ─── */}
        <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-xs">
          {/* Wide Cover Image Banner */}
          <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-gradient-to-r from-[#26183D] via-[#382451] to-[#7135E8]">
            <img
              src={coverUrl}
              alt="Talent Cover"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          {/* Profile Header Details Bar */}
          <div className="relative px-4 pb-4 pt-2 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Avatar + Main Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Circular Overlapping Avatar */}
                <div className="relative shrink-0 -mt-14 sm:-mt-20 md:-mt-24 group">
                  <div className="h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-full border-4 border-white bg-[#26183D] shadow-xl ring-2 ring-black/5">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#7135E8] text-3xl font-extrabold text-white">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Text */}
                <div className="text-center sm:text-left pt-2 sm:pt-6 md:pt-8 pb-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#212529] tracking-tight">
                      {fullName}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#16A34A] bg-white px-2.5 py-0.5 text-xs font-bold text-[#16A34A]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                      Verified Talent
                    </span>
                    <span className="rounded bg-[#7135E8] px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                      {talent.role}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#7135E8] mt-1">
                    {headline}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#6C757D]">
                    <span className="flex items-center gap-1 text-[#6C757D]">
                      <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
                      <span>{profile?.location || "Algeria"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#6C757D]">
                      <Calendar className="h-3.5 w-3.5 text-[#0D6EFD]" />
                      <span>
                        Member since {talent.created_at ? formatDate(talent.created_at) : "2026"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2.5 pb-2">
                {!isReviewer ? (
                  <Button
                    onClick={() => setHireOpen(true)}
                    className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2 shadow-xs"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    <span>Hire Talent</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => setActiveTab("projects")}
                    className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2 shadow-xs"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Review Projects</span>
                  </Button>
                )}
              </div>
            </div>

            {/* ── Section 2: Profile Navigation Tabs ── */}
            <div className="mt-6 flex flex-wrap items-center gap-1 border-t border-[#E9ECEF] pt-1">
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ProfileTab)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-colors",
                      isActive
                        ? "text-[#7135E8]"
                        : "text-[#6C757D] hover:text-[#212529] hover:bg-[#F8F9FA] rounded-md",
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {typeof tab.badge === "number" && (
                      <span className="rounded-full bg-[#E9ECEF] px-1.5 py-0.2 text-[10px] font-bold text-[#212529]">
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-[#7135E8]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section 2: Summary Stats Row (NO tinted background boxes!) ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#7135E8]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{skills.length}</p>
                <p className="text-xs text-[#6C757D]">Verified Skills</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <BriefcaseBusiness className="h-5 w-5 text-[#0D6EFD]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{projects.length}</p>
                <p className="text-xs text-[#6C757D]">Verified Projects</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <HeartHandshake className="h-5 w-5 text-[#16A34A]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{volunteerApps.length}</p>
                <p className="text-xs text-[#6C757D]">Missions Joined</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-[#F5B51B]" />
              <div>
                <p className="text-xl font-bold text-[#212529]">{languages.length}</p>
                <p className="text-xs text-[#6C757D]">Languages</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Tab Content ─────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column (4 cols): Bio, Particulars, Socials, Hire CTA */}
            <div className="space-y-6 lg:col-span-4">
              <AdminCard title="Professional Summary" icon={Briefcase}>
                <p className="text-xs text-[#6C757D] leading-relaxed whitespace-pre-line">
                  {profile?.bio || "No professional biography has been provided for this talent profile."}
                </p>

                <div className="mt-4 space-y-2.5 border-t border-[#E9ECEF] pt-4 text-xs">
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Briefcase className="h-4 w-4 text-[#7135E8] shrink-0" />
                    <span className="font-semibold">{headline}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <MapPin className="h-4 w-4 text-[#DC3545] shrink-0" />
                    <span>{profile?.location || "Algeria"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Calendar className="h-4 w-4 text-[#0D6EFD] shrink-0" />
                    <span>Member since {talent.created_at ? formatDate(talent.created_at) : "2026"}</span>
                  </div>
                </div>
              </AdminCard>

              {/* Social Media Presence - Real SVG icons, NO tinted background */}
              <AdminCard title="Social Media Presence" icon={Share2}>
                {socials.length > 0 ? (
                  <div className="space-y-2">
                    {socials.map((social) => {
                      const href = social.url.startsWith("http") ? social.url : `https://${social.url}`;
                      return (
                        <a
                          key={social.id}
                          href={href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2.5 bg-white hover:border-[#7135E8] transition-colors group text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <SocialIcon platform={social.platform} className="h-4 w-4 shrink-0" />
                            <div>
                              <span className="font-bold text-[#212529] capitalize block">
                                {social.platform}
                              </span>
                              <span className="text-[11px] text-[#6C757D] truncate max-w-[180px] block">
                                {social.url}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-[#6C757D] group-hover:text-[#7135E8] transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D] text-center py-2">
                    No social media accounts connected.
                  </p>
                )}
              </AdminCard>

              {/* Hire Opportunity Card */}
              {!isReviewer && (
                <div className="rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <BriefcaseBusiness className="h-5 w-5 text-[#7135E8]" />
                    <h3 className="text-sm font-bold text-[#212529]">Interested in Hiring?</h3>
                  </div>
                  <p className="text-xs text-[#6C757D] leading-relaxed">
                    Connect directly with {fullName} for freelance projects, technical roles, or partnerships.
                  </p>
                  <Button
                    onClick={() => setHireOpen(true)}
                    className="mt-4 w-full bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Hiring Request</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column (8 cols): Skills, Projects, Volunteering */}
            <div className="space-y-6 lg:col-span-8">
              {/* Verified Skills */}
              <AdminCard
                title="Verified Skills"
                icon={Sparkles}
                headerActions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("skills")}
                    className="text-xs text-[#7135E8] hover:text-[#5e26cb] font-semibold"
                  >
                    View All
                  </Button>
                }
              >
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((userSkill) => (
                      <div
                        key={userSkill.id}
                        className="flex items-center gap-2 rounded-lg border border-[#E9ECEF] bg-white px-3 py-1.5 text-xs font-semibold text-[#212529]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                        <span>{userSkill.skills?.name}</span>
                        {userSkill.level && (
                          <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-bold text-[#6C757D] uppercase">
                            {userSkill.level}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D]">No verified skills registered.</p>
                )}
              </AdminCard>

              {/* Verified Projects */}
              <AdminCard
                title="Verified Projects"
                icon={FolderKanban}
                headerActions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("projects")}
                    className="text-xs text-[#7135E8] hover:text-[#5e26cb] font-semibold"
                  >
                    View All
                  </Button>
                }
              >
                {projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="rounded-lg border border-[#E9ECEF] bg-white p-4 hover:border-[#7135E8] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-[#212529]">{project.title}</h4>
                            <p className="text-[11px] text-[#6C757D] mt-1 line-clamp-2">
                              {project.description || "No project description provided."}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                            Verified
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D]">No verified projects recorded yet.</p>
                )}
              </AdminCard>

              {/* Volunteering Activity */}
              <AdminCard
                title="Volunteering Experience"
                icon={HeartHandshake}
                headerActions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("volunteering")}
                    className="text-xs text-[#7135E8] hover:text-[#5e26cb] font-semibold"
                  >
                    View All
                  </Button>
                }
              >
                {volunteerApps.length > 0 ? (
                  <div className="space-y-3">
                    {volunteerApps.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-lg border border-[#E9ECEF] bg-white p-3 text-xs"
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="font-bold text-[#212529] truncate">{app.activity.title}</h4>
                          <p className="text-[11px] text-[#6C757D] mt-0.5">
                            {app.activity.organization?.name || "NGO Partner"} • {formatDate(app.application_date)}
                          </p>
                        </div>
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize bg-[#16A34A]/10 text-[#16A34A]">
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D]">No volunteering missions joined yet.</p>
                )}
              </AdminCard>
            </div>
          </div>
        )}

        {/* ── Tab: About & Contact ──────────────────────────────── */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <AdminCard title="Identity & Particulars" icon={User}>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#E9ECEF]">
                    <span className="text-[#6C757D]">Full Name</span>
                    <span className="font-bold text-[#212529]">{fullName}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#E9ECEF]">
                    <span className="text-[#6C757D]">Professional Headline</span>
                    <span className="font-bold text-[#7135E8]">{headline}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#E9ECEF]">
                    <span className="text-[#6C757D]">Location</span>
                    <span className="font-medium text-[#212529]">{profile?.location || "Algeria"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[#6C757D]">Member Since</span>
                    <span className="font-medium text-[#212529]">
                      {talent.created_at ? formatDate(talent.created_at) : "2026"}
                    </span>
                  </div>
                </div>
              </AdminCard>

              {/* Languages */}
              <AdminCard title="Languages Spoken" icon={LanguagesIcon}>
                {languages.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {languages.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between rounded-lg border border-[#E9ECEF] bg-white p-3 text-xs"
                      >
                        <span className="font-bold text-[#212529]">{l.languages?.name || "Language"}</span>
                        {l.proficiency && (
                          <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[11px] font-semibold text-[#6C757D] uppercase">
                            {l.proficiency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D]">No languages listed.</p>
                )}
              </AdminCard>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <AdminCard title="Social Media Presence" icon={Share2}>
                {socials.length > 0 ? (
                  <div className="space-y-2">
                    {socials.map((social) => {
                      const href = social.url.startsWith("http") ? social.url : `https://${social.url}`;
                      return (
                        <a
                          key={social.id}
                          href={href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2.5 bg-white hover:border-[#7135E8] transition-colors group text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <SocialIcon platform={social.platform} className="h-4 w-4 shrink-0" />
                            <div>
                              <span className="font-bold text-[#212529] capitalize block">
                                {social.platform}
                              </span>
                              <span className="text-[11px] text-[#6C757D] truncate max-w-[180px] block">
                                {social.url}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-[#6C757D] group-hover:text-[#7135E8] transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D]">No social media connected.</p>
                )}
              </AdminCard>
            </div>
          </div>
        )}

        {/* ── Tab: Skills & Qualifications ──────────────────────── */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <AdminCard title="Verified Skills" icon={Sparkles}>
              {skills.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="rounded-lg border border-[#E9ECEF] bg-white p-3.5 hover:border-[#7135E8] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#212529]">
                          {skill.skills?.name || "Skill"}
                        </span>
                        {skill.level && (
                          <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold text-[#6C757D] uppercase">
                            {skill.level}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6C757D]">No verified skills listed.</p>
              )}
            </AdminCard>

            {/* Work Experiences */}
            {workExperiences.length > 0 && (
              <AdminCard title="Work Experience Timeline" icon={Briefcase}>
                <div className="space-y-4">
                  {workExperiences.map((exp) => (
                    <div key={exp.id} className="rounded-lg border border-[#E9ECEF] bg-white p-4">
                      <h4 className="text-xs font-bold text-[#212529]">{exp.job_title}</h4>
                      <p className="text-xs text-[#7135E8] font-semibold mt-0.5">{exp.company}</p>
                      <p className="text-[11px] text-[#6C757D] mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : "Present"}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-[#6C757D] mt-2 whitespace-pre-line leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AdminCard>
            )}

            {/* Educations */}
            {educations.length > 0 && (
              <AdminCard title="Education History" icon={GraduationCap}>
                <div className="space-y-4">
                  {educations.map((edu) => (
                    <div key={edu.id} className="rounded-lg border border-[#E9ECEF] bg-white p-4">
                      <h4 className="text-xs font-bold text-[#212529]">{edu.degree} in {edu.field_of_study}</h4>
                      <p className="text-xs text-[#7135E8] font-semibold mt-0.5">{edu.school}</p>
                      <p className="text-[11px] text-[#6C757D] mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : "Present"}
                      </p>
                    </div>
                  ))}
                </div>
              </AdminCard>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <AdminCard title="Certifications" icon={Award}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="rounded-lg border border-[#E9ECEF] bg-white p-3.5">
                      <h4 className="text-xs font-bold text-[#212529]">{cert.name}</h4>
                      <p className="text-xs text-[#7135E8] font-semibold mt-0.5">{cert.issuer}</p>
                      {cert.issue_date && (
                        <p className="text-[11px] text-[#6C757D] mt-1">Issued: {formatDate(cert.issue_date)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AdminCard>
            )}
          </div>
        )}

        {/* ── Tab: Projects & Portfolio ─────────────────────────── */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#212529]">Verified Projects</h3>
              <p className="text-xs text-[#6C757D]">
                Reviewed and verified software, design, or engineering achievements.
              </p>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs hover:border-[#7135E8] transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-bold text-[#212529]">{project.title}</h4>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#16A34A] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-[#6C757D] mt-2 line-clamp-3 leading-relaxed">
                        {project.description || "No project description provided."}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#E9ECEF] pt-3 text-[11px] text-[#6C757D]">
                      <span>{project.created_at ? formatDate(project.created_at) : "N/A"}</span>
                      <span className="font-bold text-[#7135E8]">Verified by JADARA</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
                <h3 className="text-sm font-bold text-[#212529]">No verified projects yet</h3>
                <p className="text-xs text-[#6C757D] mt-1">This talent has not submitted projects for verification yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Volunteering Experience ──────────────────────── */}
        {activeTab === "volunteering" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#212529]">Volunteering Experience</h3>
              <p className="text-xs text-[#6C757D]">
                Community impact and missions completed with JADARA partner organizations.
              </p>
            </div>

            {volunteerApps.length > 0 ? (
              <div className="space-y-3">
                {volunteerApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs hover:border-[#7135E8] transition-colors"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#212529]">{app.activity.title}</h4>
                      <p className="text-xs text-[#6C757D]">
                        {app.activity.organization?.name || "NGO Partner"} • {app.activity.location || "Algeria"}
                      </p>
                      <p className="text-[11px] text-[#6C757D]">
                        Applied on {formatDate(app.application_date)}
                      </p>
                    </div>

                    <span className="rounded-full px-3 py-1 text-xs font-bold capitalize bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-12 text-center">
                <HeartHandshake className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
                <h3 className="text-sm font-bold text-[#212529]">No volunteering missions yet</h3>
                <p className="text-xs text-[#6C757D] mt-1">No volunteering activities recorded for this candidate.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Hire Modal ────────────────────────────────────────── */}
      {hireOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-lg rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#212529]">
                  Hire {fullName}
                </h2>
                <p className="mt-1 text-xs text-[#6C757D]">
                  Send a collaboration or employment opportunity inquiry to this verified professional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHireOpen(false)}
                className="rounded-lg p-1.5 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#212529]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="hire-message" className="text-xs font-bold text-[#212529]">
                Opportunity Message
              </label>
              <textarea
                id="hire-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${firstName || "there"}, we are interested in discussing an opportunity with you at our company...`}
                rows={5}
                className="mt-1.5 w-full resize-none rounded-xl border border-[#E9ECEF] bg-white p-3 text-xs text-[#212529] outline-none placeholder:text-[#ADB5BD] focus:border-[#7135E8]"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setHireOpen(false)}
                className="border-[#E9ECEF] text-xs text-[#6C757D]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setHireOpen(false);
                  setMessage("");
                  toast.success("Interest sent successfully! The talent has been notified.");
                }}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send Interest</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
