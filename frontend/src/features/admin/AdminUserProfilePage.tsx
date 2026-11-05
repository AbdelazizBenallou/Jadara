import { useState, useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Award,
  Languages as LanguagesIcon,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Edit2,
  Share2,
  HeartHandshake,
  Building,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getPublicProfile, updateUser } from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { SocialIcon } from "@/components/common/SocialIcon";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

type ProfileTab =
  | "overview"
  | "about"
  | "skills"
  | "projects"
  | "volunteering"
  | "managed_activities";

export function AdminUserProfilePage() {
  const { id } = useParams({ strict: false });
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit status form state
  const [editStatus, setEditStatus] = useState<"active" | "inactive" | "locked" | "pending">("active");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  const { data: userProfile, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.users.profile(id ?? 0),
    queryFn: () => getPublicProfile(id!),
    enabled: !!id,
  });

  const isBeneficiary = userProfile?.role?.toLowerCase() === "beneficiary";
  const isOrganization = userProfile?.role?.toLowerCase() === "organization";

  // Calculate completeness breakdown for this user
  const completeness = useMemo(() => {
    if (!userProfile) return { percentage: 0, checklist: [], completed: 0, total: 7 };
    const hasAvatar = !!userProfile.profiles?.avatar_url || !!userProfile.profiles?.avatar;
    const hasBio = !!userProfile.profiles?.bio && userProfile.profiles.bio.trim().length > 0;
    const hasContact = !!userProfile.profiles?.phone && userProfile.profiles.phone.trim().length > 0;
    const hasEducation = (userProfile.educations?.length ?? 0) > 0;
    const hasSkills = (userProfile.user_skills?.length ?? 0) > 0;
    const hasLanguages = (userProfile.user_languages?.length ?? 0) > 0;
    const hasSocials = (userProfile.user_socials?.length ?? 0) > 0;

    const checklist = [
      { label: "Profile Picture", done: hasAvatar },
      { label: "Biography", done: hasBio },
      { label: "Contact Info", done: hasContact },
      { label: "Education History", done: hasEducation },
      { label: "Skills Registered", done: hasSkills },
      { label: "Languages Added", done: hasLanguages },
      { label: "Social Media Links", done: hasSocials },
    ];

    const completed = checklist.filter((item) => item.done).length;
    const percentage = Math.round((completed / checklist.length) * 100);

    return { percentage, checklist, completed, total: checklist.length };
  }, [userProfile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUser(id!, {
        status: editStatus,
        first_name: editFirstName,
        last_name: editLastName,
      }),
    onSuccess: () => {
      toast.success("User profile updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(id ?? 0) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setIsEditModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update user");
    },
  });

  const openEditModal = () => {
    if (userProfile) {
      setEditStatus((userProfile.status as any) || "active");
      setEditFirstName(userProfile.profiles?.first_name || "");
      setEditLastName(userProfile.profiles?.last_name || "");
      setIsEditModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="admin"
        title="User Profile"
        subtitle="Loading user identity and account details..."
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#7135E8]" />
          <p className="mt-3 text-xs font-semibold text-[#6C757D]">
            Loading profile dossier...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !userProfile) {
    return (
      <DashboardLayout
        role="admin"
        title="User Profile"
        subtitle="The requested user profile could not be found."
      >
        <div className="rounded-xl border border-[#E9ECEF] bg-white p-12 text-center shadow-sm">
          <User className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
          <h2 className="text-lg font-bold text-[#212529]">User Not Found</h2>
          <p className="mt-1 text-xs text-[#6C757D]">
            The requested user profile does not exist or has been removed.
          </p>
          <div className="mt-4">
            <Link to="/admin/users">
              <Button className="bg-[#7135E8] text-white hover:bg-[#5e26cb]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users Directory
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName =
    userProfile.profiles?.first_name || userProfile.profiles?.last_name
      ? `${userProfile.profiles.first_name || ""} ${userProfile.profiles.last_name || ""}`.trim()
      : userProfile.email || `User #${userProfile.id}`;

  const initials = (fullName.charAt(0) || "U").toUpperCase();

  const coverUrl =
    userProfile.profiles?.cover_url ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80";

  // Build navigation tabs dynamically
  const navTabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "about", label: "About & Contact", icon: User },
    { id: "skills", label: "Skills & Qualifications", icon: Sparkles },
    { id: "projects", label: "Projects & Portfolio", icon: FolderKanban },
    ...(isBeneficiary
      ? [
          {
            id: "volunteering",
            label: "Volunteering Joined",
            icon: HeartHandshake,
            badge: userProfile.volunteer_applications?.length ?? 0,
          },
        ]
      : []),
    ...(isOrganization
      ? [
          {
            id: "managed_activities",
            label: "Managed Activities",
            icon: HeartHandshake,
            badge: userProfile.organizations?.[0]?.activities?.length ?? 0,
          },
        ]
      : []),
  ];

  const orgData = userProfile.organizations?.[0];

  return (
    <DashboardLayout
      role="admin"
      title={fullName}
      subtitle={t("admin.userProfileSubtitle", {
        defaultValue: `Account credentials, skills verification, and activity profile for ${fullName}`,
      })}
    >
      <div className="space-y-6">
        {/* Breadcrumb back link */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7135E8] hover:text-[#5a2ab8] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6C757D]">User ID:</span>
            <span className="font-mono text-xs font-bold text-[#212529] bg-white px-2 py-0.5 rounded border border-[#E9ECEF]">
              #{userProfile.id}
            </span>
          </div>
        </div>

        {/* ── Section 1: Facebook-Inspired Header & Cover Banner ─── */}
        <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm">
          {/* Wide Cover Image Banner */}
          <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-gradient-to-r from-[#26183D] via-[#382451] to-[#7135E8]">
            <img
              src={coverUrl}
              alt="Profile Cover"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          {/* Profile Header Details Bar */}
          <div className="relative px-4 pb-4 pt-2 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Avatar + Main Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Large Circular Avatar Overlapping Cover */}
                <div className="relative group shrink-0 -mt-14 sm:-mt-20 md:-mt-24">
                  <div className="h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-full border-4 border-white bg-[#26183D] shadow-xl ring-2 ring-black/5">
                    {userProfile.profiles?.avatar_url ? (
                      <img
                        src={userProfile.profiles.avatar_url}
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
                    {userProfile.role?.toLowerCase() === "admin" && (
                      <span
                        title="Platform Administrator"
                        className="inline-flex items-center text-[#0D6EFD]"
                      >
                        <CheckCircle2 className="h-5 w-5 fill-[#0D6EFD] text-white" />
                      </span>
                    )}
                    {/* Role Badge */}
                    <span className="rounded bg-[#7135E8] px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                      {userProfile.role}
                    </span>
                    {/* Status Badge */}
                    <StatusBadge status={userProfile.status} />
                  </div>

                  <p className="text-xs font-mono text-[#6C757D] mt-1">
                    @{userProfile.email?.split("@")[0] || "user"} • {userProfile.email}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#6C757D]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#28A745]">
                      <span className="h-2 w-2 rounded-full bg-[#28A745]" />
                      <span className="capitalize">{userProfile.status} Account</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#6C757D]">
                      <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
                      <span>{userProfile.profiles?.location || orgData?.location || "Location not specified"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#6C757D]">
                      <Calendar className="h-3.5 w-3.5 text-[#0D6EFD]" />
                      <span>
                        Member since {userProfile.created_at ? formatDate(userProfile.created_at) : "N/A"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center justify-center gap-2.5 pb-2">
                <Button
                  onClick={openEditModal}
                  className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2 shadow-xs"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Account Status</span>
                </Button>
              </div>
            </div>

            {/* ── Section 2: Facebook-Inspired Profile Navigation Tabs ── */}
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
                    {typeof (tab as any).badge === "number" && (
                      <span className="rounded-full bg-[#E9ECEF] px-1.5 py-0.2 text-[10px] font-bold text-[#212529]">
                        {(tab as any).badge}
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

        {/* ── Section 3: Main Profile Content (2 Columns) ───────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: About, Contact & Social Links (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Professional Summary */}
            <AdminCard title="Professional Summary" icon={Briefcase}>
              <p className="text-xs text-[#6C757D] leading-relaxed">
                {userProfile.profiles?.bio ||
                  orgData?.description ||
                  "No professional summary or biography has been provided for this account."}
              </p>

              <div className="mt-4 space-y-2.5 border-t border-[#E9ECEF] pt-4 text-xs">
                <div className="flex items-center gap-2.5 text-[#212529]">
                  <Briefcase className="h-4 w-4 text-[#7135E8] shrink-0" />
                  <span className="font-semibold capitalize">{userProfile.role} Account</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#212529]">
                  <MapPin className="h-4 w-4 text-[#DC3545] shrink-0" />
                  <span>{userProfile.profiles?.location || orgData?.location || "Location not specified"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#212529]">
                  <Mail className="h-4 w-4 text-[#0D6EFD] shrink-0" />
                  <span className="truncate">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#212529]">
                  <Phone className="h-4 w-4 text-[#28A745] shrink-0" />
                  <span>{userProfile.profiles?.phone || orgData?.phone || "No phone number added"}</span>
                </div>
                {orgData?.website && (
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Building className="h-4 w-4 text-[#7135E8] shrink-0" />
                    <a
                      href={orgData.website.startsWith("http") ? orgData.website : `https://${orgData.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0D6EFD] hover:underline truncate"
                    >
                      {orgData.website}
                    </a>
                  </div>
                )}
              </div>
            </AdminCard>

            {/* Contact & Personal Details Card */}
            <AdminCard title="Identity & Particulars" icon={User}>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#E9ECEF]">
                  <span className="text-[#6C757D]">Full Name / Identity</span>
                  <span className="font-bold text-[#212529]">{fullName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#E9ECEF]">
                  <span className="text-[#6C757D]">System Role</span>
                  <span className="font-bold text-[#7135E8] capitalize">{userProfile.role}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#E9ECEF]">
                  <span className="text-[#6C757D]">Account Status</span>
                  <span className="font-bold text-[#28A745] capitalize">{userProfile.status}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#E9ECEF]">
                  <span className="text-[#6C757D]">Gender</span>
                  <span className="font-medium text-[#212529] capitalize">
                    {userProfile.profiles?.gender || "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#E9ECEF]">
                  <span className="text-[#6C757D]">Date of Birth</span>
                  <span className="font-medium text-[#212529]">
                    {userProfile.profiles?.date_of_birth
                      ? formatDate(userProfile.profiles.date_of_birth)
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#6C757D]">Joined Date</span>
                  <span className="font-medium text-[#212529]">
                    {userProfile.created_at ? formatDate(userProfile.created_at) : "N/A"}
                  </span>
                </div>
              </div>
            </AdminCard>

            {/* Social Media Links Card - WITH REAL BRAND ICONS & NO LIGHT BG */}
            <AdminCard title="Social Media Presence" icon={Share2}>
              {userProfile.user_socials && userProfile.user_socials.length > 0 ? (
                <div className="space-y-2">
                  {userProfile.user_socials.map((social) => {
                    const href = social.url.startsWith("http")
                      ? social.url
                      : `https://${social.url}`;
                    return (
                      <a
                        key={social.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2.5 bg-white hover:border-[#7135E8] transition-colors group text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Real Brand Icon - no tinted bg */}
                          <SocialIcon platform={social.platform} className="h-4 w-4" />
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
                <div className="p-4 text-center text-xs text-[#6C757D]">
                  <Share2 className="mx-auto h-6 w-6 text-[#ADB5BD] mb-1.5" />
                  <p>No social media links connected.</p>
                </div>
              )}
            </AdminCard>
          </div>

          {/* RIGHT COLUMN: Tab Content (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Profile Completeness Assessment Card */}
            <AdminCard title="Profile Completeness Assessment" icon={CheckCircle2}>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-[#212529]">
                      {completeness.percentage}%
                    </span>
                    <span className="ml-2 text-xs font-semibold text-[#6C757D]">
                      Profile Completeness Score
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#28A745] bg-[#F4F6F9] px-2.5 py-1 rounded-md border border-[#E9ECEF]">
                    {completeness.completed} of {completeness.total} criteria complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E9ECEF]">
                  <div
                    className="h-full rounded-full bg-[#7135E8] transition-all duration-500"
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>

                {/* Checklist items */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  {completeness.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border p-2 text-[11px] font-semibold",
                        item.done
                          ? "border-[#28A745]/30 bg-[#F4F6F9] text-[#28A745]"
                          : "border-[#E9ECEF] bg-white text-[#6C757D]",
                      )}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#28A745]" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-[#ADB5BD]" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AdminCard>

            {/* TAB: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Beneficiary Volunteering Snapshot (if Beneficiary) */}
                {isBeneficiary && (
                  <AdminCard title="Volunteering Engagements Snapshot" icon={HeartHandshake}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg border border-[#E9ECEF] p-3">
                        <span className="text-xs text-[#6C757D] font-semibold block">
                          Activities Joined / Applied
                        </span>
                        <span className="text-xl font-extrabold text-[#212529]">
                          {userProfile.volunteer_applications?.length ?? 0}
                        </span>
                      </div>
                      <div className="rounded-lg border border-[#E9ECEF] p-3">
                        <span className="text-xs text-[#6C757D] font-semibold block">
                          Completed Missions
                        </span>
                        <span className="text-xl font-extrabold text-[#28A745]">
                          {userProfile.completed_volunteering?.length ?? 0}
                        </span>
                      </div>
                    </div>

                    {userProfile.volunteer_applications && userProfile.volunteer_applications.length > 0 ? (
                      <div className="space-y-2.5">
                        {userProfile.volunteer_applications.slice(0, 3).map((app) => (
                          <div
                            key={app.id}
                            className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3 bg-white text-xs"
                          >
                            <div>
                              <h5 className="font-bold text-[#212529]">{app.activity.title}</h5>
                              <p className="text-[11px] text-[#6C757D]">
                                Org: {app.activity.organization?.name || "Jadara Partner"} • Applied {formatDate(app.application_date)}
                              </p>
                            </div>
                            <span className="capitalize font-bold text-[10px] rounded bg-[#F4F6F9] px-2 py-0.5 border border-[#E9ECEF]">
                              {app.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6C757D]">No volunteering activities applied to yet.</p>
                    )}
                  </AdminCard>
                )}

                {/* Organization Managed Campaigns Snapshot (if Organization) */}
                {isOrganization && (
                  <AdminCard title="Organization Campaigns Snapshot" icon={Building}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg border border-[#E9ECEF] p-3">
                        <span className="text-xs text-[#6C757D] font-semibold block">
                          Total Campaigns Managed
                        </span>
                        <span className="text-xl font-extrabold text-[#7135E8]">
                          {orgData?.activities?.length ?? 0}
                        </span>
                      </div>
                      <div className="rounded-lg border border-[#E9ECEF] p-3">
                        <span className="text-xs text-[#6C757D] font-semibold block">
                          Organization Entity
                        </span>
                        <span className="text-sm font-bold text-[#212529] truncate block">
                          {orgData?.name || "Registered Partner"}
                        </span>
                      </div>
                    </div>

                    {orgData?.activities && orgData.activities.length > 0 ? (
                      <div className="space-y-2.5">
                        {orgData.activities.slice(0, 3).map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3 bg-white text-xs"
                          >
                            <div>
                              <h5 className="font-bold text-[#212529]">{act.title}</h5>
                              <p className="text-[11px] text-[#6C757D]">
                                {act.location || "Online"} • {act._count?.applications ?? 0} volunteers applied
                              </p>
                            </div>
                            <span className="capitalize font-bold text-[10px] rounded bg-[#F4F6F9] px-2 py-0.5 border border-[#E9ECEF]">
                              {act.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6C757D]">No managed volunteering activities created yet.</p>
                    )}
                  </AdminCard>
                )}

                {/* Registered Skills */}
                <AdminCard title="Registered Skills & Proficiencies" icon={Sparkles}>
                  {userProfile.user_skills && userProfile.user_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.user_skills.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 rounded-lg border border-[#E9ECEF] bg-white px-3 py-2 text-xs shadow-xs"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#28A745]" />
                          <span className="font-bold text-[#212529]">
                            {s.name || s.skills?.name || "Skill"}
                          </span>
                          <span className="capitalize text-[10px] rounded bg-[#F4F6F9] px-1.5 py-0.2 font-semibold text-[#6C757D]">
                            {s.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">
                      No skills have been registered for this user yet.
                    </p>
                  )}
                </AdminCard>

                {/* Recent Projects Preview */}
                <AdminCard title="Recent Project Submissions" icon={FolderKanban}>
                  {userProfile.projects && userProfile.projects.length > 0 ? (
                    <div className="space-y-3">
                      {userProfile.projects.slice(0, 3).map((proj) => (
                        <div
                          key={proj.id}
                          className="rounded-lg border border-[#E9ECEF] p-3.5 bg-white hover:border-[#7135E8] transition-colors text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-[#212529]">{proj.title}</h4>
                              <p className="text-[#6C757D] mt-0.5 line-clamp-1">
                                {proj.description || "No description provided."}
                              </p>
                            </div>
                            <span className="capitalize text-[10px] font-bold rounded bg-[#F4F6F9] px-2 py-0.5 border border-[#E9ECEF]">
                              {proj.status}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center gap-3 pt-2 border-t border-[#E9ECEF] text-[11px]">
                            {proj.sub_domain && (
                              <span className="font-semibold text-[#7135E8]">
                                {proj.sub_domain.name}
                              </span>
                            )}
                            {proj.github_url && (
                              <a
                                href={proj.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0D6EFD] hover:underline flex items-center gap-1 font-medium"
                              >
                                <span>GitHub</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <span className="ml-auto text-[#6C757D]">
                              {formatDate(proj.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">
                      No projects submitted by this user.
                    </p>
                  )}
                </AdminCard>
              </div>
            )}

            {/* TAB: About & Contact */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <AdminCard title="Comprehensive Biography" icon={User}>
                  <p className="text-xs text-[#212529] leading-relaxed whitespace-pre-line">
                    {userProfile.profiles?.bio ||
                      orgData?.description ||
                      "No extended biography or career objective has been written."}
                  </p>
                </AdminCard>

                <AdminCard title="Languages & Communications" icon={LanguagesIcon}>
                  {userProfile.user_languages && userProfile.user_languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.user_languages.map((lang) => (
                        <div
                          key={lang.id}
                          className="rounded-lg border border-[#E9ECEF] bg-white px-3 py-2 text-xs font-semibold text-[#212529]"
                        >
                          <span className="font-bold">{lang.languages?.name || "Language"}</span>
                          <span className="ml-2 capitalize text-[10px] rounded bg-[#F4F6F9] px-1.5 py-0.2 text-[#6C757D]">
                            {lang.proficiency}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">No language proficiencies recorded.</p>
                  )}
                </AdminCard>
              </div>
            )}

            {/* TAB: Skills & Qualifications */}
            {activeTab === "skills" && (
              <div className="space-y-6">
                {/* Full Skills Directory */}
                <AdminCard title="Technical & Functional Skills" icon={Sparkles}>
                  {userProfile.user_skills && userProfile.user_skills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {userProfile.user_skills.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-[#E9ECEF] bg-white p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#28A745]" />
                            <span className="font-bold text-[#212529]">
                              {s.name || s.skills?.name || "Skill"}
                            </span>
                          </div>
                          <span className="capitalize text-[10px] rounded bg-[#F4F6F9] px-2 py-0.5 font-bold text-[#7135E8]">
                            {s.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">No skills found.</p>
                  )}
                </AdminCard>

                {/* Work Experience Timeline */}
                <AdminCard title="Work Experience History" icon={Briefcase}>
                  {userProfile.work_experiences && userProfile.work_experiences.length > 0 ? (
                    <div className="space-y-4 divide-y divide-[#E9ECEF]">
                      {userProfile.work_experiences.map((exp) => (
                        <div key={exp.id} className="pt-3 first:pt-0 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-[#212529]">{exp.job_title}</h4>
                              <p className="font-medium text-[#7135E8]">{exp.company}</p>
                            </div>
                            <span className="text-[11px] text-[#6C757D]">
                              {formatDate(exp.start_date)} -{" "}
                              {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : "N/A"}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="mt-1.5 text-[#6C757D] leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">No work experiences recorded.</p>
                  )}
                </AdminCard>

                {/* Education Timeline */}
                <AdminCard title="Education & Academic Background" icon={GraduationCap}>
                  {userProfile.educations && userProfile.educations.length > 0 ? (
                    <div className="space-y-4 divide-y divide-[#E9ECEF]">
                      {userProfile.educations.map((edu) => (
                        <div key={edu.id} className="pt-3 first:pt-0 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-[#212529]">{edu.degree}</h4>
                              <p className="font-medium text-[#0D6EFD]">
                                {edu.school} {edu.field_of_study && `• ${edu.field_of_study}`}
                              </p>
                            </div>
                            <span className="text-[11px] text-[#6C757D]">
                              {formatDate(edu.start_date)} -{" "}
                              {edu.is_current ? "Present" : edu.end_date ? formatDate(edu.end_date) : "N/A"}
                            </span>
                          </div>
                          {edu.description && (
                            <p className="mt-1.5 text-[#6C757D]">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">No education records found.</p>
                  )}
                </AdminCard>

                {/* Certifications */}
                <AdminCard title="Licenses & Certifications" icon={Award}>
                  {userProfile.certifications && userProfile.certifications.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {userProfile.certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="rounded-lg border border-[#E9ECEF] bg-white p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-[#FFC107]" />
                            <span className="font-bold text-[#212529]">{cert.name}</span>
                          </div>
                          <p className="mt-1 text-[#6C757D]">{cert.issuer}</p>
                          {cert.issue_date && (
                            <p className="mt-0.5 text-[11px] text-[#6C757D]">
                              Issued: {formatDate(cert.issue_date)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C757D]">No certifications uploaded.</p>
                  )}
                </AdminCard>
              </div>
            )}

            {/* TAB: Projects */}
            {activeTab === "projects" && (
              <AdminCard title="Submitted Projects Portfolio" icon={FolderKanban}>
                {userProfile.projects && userProfile.projects.length > 0 ? (
                  <div className="space-y-3">
                    {userProfile.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="rounded-lg border border-[#E9ECEF] p-4 bg-white hover:border-[#7135E8] transition-colors text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-[#212529]">{proj.title}</h4>
                            <p className="text-[#6C757D] mt-1 line-clamp-2">
                              {proj.description || "No description provided."}
                            </p>
                          </div>
                          <span className="capitalize text-[10px] font-bold rounded bg-[#F4F6F9] px-2.5 py-0.5 border border-[#E9ECEF]">
                            {proj.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 pt-2.5 border-t border-[#E9ECEF] text-[11px]">
                          {proj.sub_domain && (
                            <span className="font-semibold text-[#7135E8]">
                              Sub-Domain: {proj.sub_domain.name}
                            </span>
                          )}
                          {proj.github_url && (
                            <a
                              href={proj.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#0D6EFD] hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>GitHub Repository</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {proj.live_url && (
                            <a
                              href={proj.live_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#28A745] hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>Live Application</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <span className="ml-auto text-[#6C757D]">
                            Submitted {formatDate(proj.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#6C757D]">
                    <FolderKanban className="mx-auto h-8 w-8 text-[#ADB5BD] mb-2" />
                    <p className="font-medium text-[#212529]">No Projects Submitted</p>
                    <p className="mt-0.5 text-[11px]">
                      This user has not yet submitted any projects to the platform.
                    </p>
                  </div>
                )}
              </AdminCard>
            )}

            {/* TAB: Beneficiary Volunteering Activities Joined */}
            {activeTab === "volunteering" && isBeneficiary && (
              <div className="space-y-6">
                <AdminCard
                  title={`Volunteering Missions Joined (${userProfile.volunteer_applications?.length ?? 0})`}
                  icon={HeartHandshake}
                >
                  {userProfile.volunteer_applications && userProfile.volunteer_applications.length > 0 ? (
                    <div className="space-y-3">
                      {userProfile.volunteer_applications.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-lg border border-[#E9ECEF] p-4 bg-white hover:border-[#7135E8] transition-colors text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-[#212529]">
                                {app.activity.title}
                              </h4>
                              <p className="text-[#6C757D] mt-0.5 font-medium">
                                Organization: {app.activity.organization?.name || "Platform Partner"}
                              </p>
                            </div>
                            <span className="capitalize text-[10px] font-bold rounded bg-[#F4F6F9] px-2.5 py-0.5 border border-[#E9ECEF]">
                              Application: {app.status}
                            </span>
                          </div>

                          {app.activity.description && (
                            <p className="mt-2 text-[#6C757D] line-clamp-2">
                              {app.activity.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 pt-2.5 border-t border-[#E9ECEF] text-[11px]">
                            {app.activity.category && (
                              <span className="font-semibold text-[#7135E8]">
                                Category: {app.activity.category.name}
                              </span>
                            )}
                            {app.activity.location && (
                              <span className="flex items-center gap-1 text-[#6C757D]">
                                <MapPin className="h-3 w-3 text-[#DC3545]" />
                                <span>{app.activity.location}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[#6C757D]">
                              <Calendar className="h-3 w-3 text-[#0D6EFD]" />
                              <span>
                                {formatDate(app.activity.start_date)} - {formatDate(app.activity.end_date)}
                              </span>
                            </span>
                            <span className="ml-auto text-[#6C757D]">
                              Applied {formatDate(app.application_date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#6C757D]">
                      <HeartHandshake className="mx-auto h-8 w-8 text-[#ADB5BD] mb-2" />
                      <p className="font-medium text-[#212529]">No Volunteering Applications</p>
                      <p className="mt-0.5 text-[11px]">
                        This beneficiary has not joined or applied for any volunteering activities yet.
                      </p>
                    </div>
                  )}
                </AdminCard>

                {/* Completed Volunteering Missions */}
                {userProfile.completed_volunteering && userProfile.completed_volunteering.length > 0 && (
                  <AdminCard title="Certified Completed Volunteering Missions" icon={CheckCircle2}>
                    <div className="space-y-3">
                      {userProfile.completed_volunteering.map((cv) => (
                        <div
                          key={cv.id}
                          className="flex items-center justify-between rounded-lg border border-[#28A745]/30 bg-[#F4F6F9] p-3.5 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-[#28A745]" />
                              <h5 className="font-bold text-[#212529]">{cv.activity.title}</h5>
                            </div>
                            <p className="text-[11px] text-[#6C757D] mt-0.5">
                              Certified by: {cv.organization?.name || "Verified Partner"}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-[#28A745]">
                            Completed on {formatDate(cv.completed_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AdminCard>
                )}
              </div>
            )}

            {/* TAB: Organization Managed Activities */}
            {activeTab === "managed_activities" && isOrganization && (
              <div className="space-y-6">
                <AdminCard
                  title={`Activities Managed by ${orgData?.name || "Organization"} (${orgData?.activities?.length ?? 0})`}
                  icon={Building}
                >
                  {orgData?.activities && orgData.activities.length > 0 ? (
                    <div className="space-y-3.5">
                      {orgData.activities.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-lg border border-[#E9ECEF] p-4 bg-white hover:border-[#7135E8] transition-colors text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-[#212529]">{act.title}</h4>
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.2 text-[10px] font-bold border",
                                    act.is_active
                                      ? "bg-white text-[#28A745] border-[#28A745]"
                                      : "bg-white text-[#6C757D] border-[#DEE2E6]",
                                  )}
                                >
                                  {act.is_active ? "Active" : "Paused"}
                                </span>
                              </div>
                              {act.category && (
                                <p className="text-[11px] font-semibold text-[#7135E8] mt-0.5">
                                  {act.category.name}
                                </p>
                              )}
                            </div>
                            <span className="capitalize text-[10px] font-bold rounded bg-[#F4F6F9] px-2.5 py-0.5 border border-[#E9ECEF]">
                              Status: {act.status}
                            </span>
                          </div>

                          {act.description && (
                            <p className="mt-2 text-[#6C757D] line-clamp-2">
                              {act.description}
                            </p>
                          )}

                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-[#E9ECEF] text-[11px]">
                            <div>
                              <span className="text-[#6C757D] block">Required</span>
                              <span className="font-bold text-[#212529]">
                                {act.required_volunteers} volunteers
                              </span>
                            </div>
                            <div>
                              <span className="text-[#6C757D] block">Applied</span>
                              <span className="font-bold text-[#0D6EFD]">
                                {act._count?.applications ?? 0} applications
                              </span>
                            </div>
                            <div>
                              <span className="text-[#6C757D] block">Completed</span>
                              <span className="font-bold text-[#28A745]">
                                {act._count?.completed ?? 0} volunteers
                              </span>
                            </div>
                            <div>
                              <span className="text-[#6C757D] block">Location</span>
                              <span className="font-bold text-[#212529] truncate block">
                                {act.location || "Online"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#6C757D]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-[#0D6EFD]" />
                              <span>
                                {formatDate(act.start_date)} - {formatDate(act.end_date)}
                              </span>
                            </span>
                            <span>Activity #{act.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#6C757D]">
                      <Building className="mx-auto h-8 w-8 text-[#ADB5BD] mb-2" />
                      <p className="font-medium text-[#212529]">No Activities Managed</p>
                      <p className="mt-0.5 text-[11px]">
                        This organization has not created or managed any volunteering activities yet.
                      </p>
                    </div>
                  )}
                </AdminCard>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Edit User Status / Identity ─────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Account"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-[#212529]">First Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[#E9ECEF] p-2 text-xs"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-[#212529]">Last Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[#E9ECEF] p-2 text-xs"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#212529]">Account Status</label>
            <select
              className="w-full rounded-lg border border-[#E9ECEF] p-2 text-xs bg-white"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="locked">Locked</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E9ECEF]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-[#7135E8] text-white hover:bg-[#5e26cb]"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
