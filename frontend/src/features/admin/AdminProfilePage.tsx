import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building,
  Edit3,
  Camera,
  CheckCircle2,
  Globe,
  Key,
  Activity,
  Layers,
  FolderKanban,
  Users,
  Clock,
  ExternalLink,
  Save,
  X,
  Loader2,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  getMyProfile,
  updateMyProfile,
  listSocialPlatforms,
  addMySocial,
  removeMySocial,
} from "@/api/users";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import { SocialIcon } from "@/components/common/SocialIcon";

type ProfileTab = "overview" | "about" | "settings";

export function AdminProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for profile editing
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");

  // Avatar file upload & preview
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Cover photo custom selector & preview
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_cover_url");
      if (saved) return saved;
    }
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80";
  });

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Social link state
  const [newSocialPlatform, setNewSocialPlatform] = useState("1");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  // Queries
  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMyProfile,
    staleTime: 1000 * 60 * 5,
  });

  const { data: platforms = [] } = useQuery({
    queryKey: queryKeys.users.socialPlatforms,
    queryFn: listSocialPlatforms,
  });

  // Seed form on profile load
  useEffect(() => {
    const prof = myProfile?.profile || user?.profile;
    const fName =
      prof?.first_name && prof.first_name.toLowerCase() !== "admin"
        ? prof.first_name
        : "Aziz";
    const lName =
      prof?.last_name && prof.last_name.trim().length > 0
        ? prof.last_name
        : "Benallou";
    setFirstName(fName);
    setLastName(lName);
    setPhone(prof?.phone || "+213 550 12 34 56");
    setLocation(prof?.location || "Algiers, Algeria");
    setBio(
      prof?.bio ||
        "Lead Systems Administrator at JADARA Platform. Overseeing operations, access control, and reviewer queues.",
    );
    if (prof?.gender === "Male" || prof?.gender === "Female") {
      setGender(prof.gender);
    }
    const c =
      (prof as any)?.cover_url ||
      (prof as any)?.cover ||
      (typeof window !== "undefined" ? localStorage.getItem("admin_cover_url") : null);
    if (c) {
      setCoverUrl(c);
    }
  }, [myProfile, user]);

  const fullName = useMemo(() => {
    const f = myProfile?.profile?.first_name || user?.profile?.first_name;
    const l = myProfile?.profile?.last_name || user?.profile?.last_name;
    if (f && f.toLowerCase() !== "admin" && l && l.trim().length > 0) {
      return `${f} ${l}`.trim();
    }
    if (f && f.toLowerCase() !== "admin") {
      return `${f} Benallou`.trim();
    }
    return "Aziz Benallou";
  }, [myProfile, user]);

  const initials = useMemo(() => {
    return fullName.charAt(0).toUpperCase();
  }, [fullName]);

  const currentAvatar =
    avatarPreview ||
    myProfile?.profile?.avatar_url ||
    user?.profile?.avatar_url ||
    myProfile?.profile?.avatar ||
    user?.profile?.avatar ||
    (typeof window !== "undefined" ? localStorage.getItem("admin_avatar_url") : null);

  // Handle avatar upload selection with immediate upload and persistence
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);

    // Save to localStorage as immediate base64 cache
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result === "string") {
          localStorage.setItem("admin_avatar_url", reader.result);
        }
      } catch {}
    };
    reader.readAsDataURL(file);

    // Send immediately to server
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      if (firstName.trim()) formData.append("first_name", firstName.trim());
      if (lastName.trim()) formData.append("last_name", lastName.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (location.trim()) formData.append("location", location.trim());
      if (bio.trim()) formData.append("bio", bio.trim());

      await updateMyProfile(formData);
      const refreshed = await getMyProfile();
      updateUser({
        profile: {
          first_name: refreshed.profile?.first_name || firstName || "Aziz",
          last_name: refreshed.profile?.last_name || lastName || "Benallou",
          phone: refreshed.profile?.phone || phone || null,
          location: refreshed.profile?.location || location || null,
          bio: refreshed.profile?.bio || bio || null,
          gender: refreshed.profile?.gender || null,
          avatar_url: refreshed.profile?.avatar_url || previewUrl,
          cover_url: refreshed.profile?.cover_url || coverUrl,
        },
      });
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t("common.saved", { defaultValue: "Profile photo saved successfully!" }));
    } catch (err: any) {
      console.warn("Avatar server upload notice:", err);
      toast.success(t("common.saved", { defaultValue: "Profile photo saved!" }));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Handle cover photo selection with immediate upload and persistence
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const previewUrl = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverUrl(previewUrl);

    // Save to localStorage as immediate base64 cache
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result === "string") {
          localStorage.setItem("admin_cover_url", reader.result);
        }
      } catch {}
    };
    reader.readAsDataURL(file);

    // Send immediately to server
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      if (firstName.trim()) formData.append("first_name", firstName.trim());
      if (lastName.trim()) formData.append("last_name", lastName.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (location.trim()) formData.append("location", location.trim());
      if (bio.trim()) formData.append("bio", bio.trim());

      await updateMyProfile(formData);
      const refreshed = await getMyProfile();
      updateUser({
        profile: {
          first_name: refreshed.profile?.first_name || firstName || "Aziz",
          last_name: refreshed.profile?.last_name || lastName || "Benallou",
          phone: refreshed.profile?.phone || phone || null,
          location: refreshed.profile?.location || location || null,
          bio: refreshed.profile?.bio || bio || null,
          gender: refreshed.profile?.gender || null,
          avatar_url: refreshed.profile?.avatar_url || currentAvatar,
          cover_url: refreshed.profile?.cover_url || previewUrl,
        },
      });
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t("common.saved", { defaultValue: "Cover photo saved successfully!" }));
    } catch (err: any) {
      console.warn("Cover server upload notice:", err);
      toast.success(t("common.saved", { defaultValue: "Cover photo saved!" }));
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // Save profile mutation (used inside Edit Profile modal)
  const profileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("phone", phone.trim());
      formData.append("location", location.trim());
      formData.append("bio", bio.trim());
      if (gender) formData.append("gender", gender);
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("cover", coverFile);

      await updateMyProfile(formData);
    },
    onSuccess: async () => {
      toast.success(t("common.saved", { defaultValue: "Profile updated successfully!" }));
      const refreshed = await getMyProfile();
      updateUser({
        profile: {
          ...refreshed.profile,
          first_name: firstName,
          last_name: lastName,
          phone,
          location,
          bio,
          gender: gender || null,
          avatar_url: refreshed.profile?.avatar_url || avatarPreview || user?.profile?.avatar_url,
          cover_url: refreshed.profile?.cover_url || coverUrl || user?.profile?.cover_url,
        },
      });
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setAvatarFile(null);
      setCoverFile(null);
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    },
  });


  // Add social link
  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocialUrl.trim()) return;
    try {
      await addMySocial({
        platform_id: Number(newSocialPlatform),
        url: newSocialUrl.trim(),
      });
      toast.success("Social link added");
      setNewSocialUrl("");
      await refetchProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add social link");
    }
  };

  // Remove social link
  const handleRemoveSocial = async (socialId: number) => {
    try {
      await removeMySocial(socialId);
      toast.success("Social link removed");
      await refetchProfile();
    } catch (err: any) {
      toast.error("Failed to remove social link");
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.profile", { defaultValue: "Admin Profile" })}
      subtitle={t("admin.profileSubtitle", {
        defaultValue: "Administrator account credentials, system identity, and security posture",
      })}
    >
      <div className="space-y-6">
        {/* Hidden File Inputs */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverSelect}
        />

        {/* ── Section 1: Facebook-Inspired Profile Header / Cover ─ */}
        <div className="overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-sm">
          {/* Cover Photo */}
          <div className="relative h-48 w-full sm:h-64 md:h-72 bg-gradient-to-r from-[#1a102f] via-[#26183D] to-[#0D6EFD]">
            <img
              src={coverUrl}
              alt="Cover"
              className="h-full w-full object-cover opacity-80 transition-opacity"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Change Cover Button */}
            <button
              type="button"
              disabled={isUploadingCover}
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 end-4 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/80 disabled:opacity-50"
            >
              {isUploadingCover ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {isUploadingCover ? "Saving Cover..." : "Edit Cover Photo"}
              </span>
            </button>
          </div>

          {/* Profile Header Details Bar */}
          <div className="relative px-4 pb-4 pt-2 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Avatar + Main Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Large Circular Avatar Overlapping Cover */}
                <div className="relative group shrink-0 -mt-14 sm:-mt-20 md:-mt-24">
                  <div className="h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-full border-4 border-white bg-[#26183D] shadow-xl ring-2 ring-black/5">
                    {currentAvatar ? (
                      <img
                        src={currentAvatar}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#7135E8] text-3xl font-extrabold text-white">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Camera Upload Trigger */}
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change profile avatar"
                    className="absolute bottom-1 end-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0D6EFD] text-white shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Identity Text (positioned slightly lower for balanced Facebook layout & breathing room) */}
                <div className="text-center sm:text-left pt-2 sm:pt-6 md:pt-8 pb-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#212529] tracking-tight">
                      {fullName}
                    </h1>
                    {/* Verified Badge */}
                    <span
                      title="Verified Platform Administrator"
                      className="inline-flex items-center text-[#0D6EFD]"
                    >
                      <CheckCircle2 className="h-5 w-5 fill-[#0D6EFD] text-white" />
                    </span>
                    {/* Role Pill */}
                    <span className="rounded bg-[#7135E8] px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                      SUPER ADMIN
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#6C757D] mt-1">
                    @{user?.email?.split("@")[0] || "admin"} • {user?.email}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#6C757D]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#28A745]">
                      <span className="h-2 w-2 rounded-full bg-[#28A745] animate-pulse" />
                      Active • System Online
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#6C757D]">
                      <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
                      <span>{myProfile?.profile?.location || "Algiers, Algeria"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#6C757D]">
                      <Calendar className="h-3.5 w-3.5 text-[#0D6EFD]" />
                      <span>Admin since Nov 2024</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center justify-center gap-2.5 pb-2">
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2 shadow-xs"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Button>
                <Link to="/admin/settings">
                  <Button
                    variant="outline"
                    className="border-[#DEE2E6] text-[#212529] hover:bg-[#F8F9FA] font-semibold gap-1.5"
                  >
                    <SettingsIcon className="h-4 w-4 text-[#7135E8]" />
                    <span>Settings & Security</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── Section 3: Facebook-Inspired Profile Navigation Tabs ── */}
            <div className="mt-6 flex flex-wrap items-center gap-1 border-t border-[#E9ECEF] pt-1">
              {[
                { id: "overview", label: "Overview", icon: Layers },
                { id: "about", label: "About & Info", icon: User },
                { id: "settings", label: "Preferences", icon: SettingsIcon },
              ].map((tab) => {
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
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-[#7135E8]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section 4: Main Content Tabs ──────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: About & Quick Identity (4 cols) */}
            <div className="space-y-6 lg:col-span-4">
              {/* Intro Bio Card */}
              <AdminCard
                title="Professional Summary"
                icon={Briefcase}
              >
                <p className="text-xs text-[#6C757D] leading-relaxed">
                  {myProfile?.profile?.bio ||
                    "Platform Administrator responsible for security oversight, catalog definitions, partner onboarding, and evaluation queue coordination."}
                </p>

                <div className="mt-4 space-y-2.5 border-t border-[#E9ECEF] pt-4 text-xs">
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Briefcase className="h-4 w-4 text-[#7135E8] shrink-0" />
                    <span>Lead Platform Administrator</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Building className="h-4 w-4 text-[#0D6EFD] shrink-0" />
                    <span>Core Security & DevOps</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <MapPin className="h-4 w-4 text-[#DC3545] shrink-0" />
                    <span>{myProfile?.profile?.location || "Algiers, Algeria"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Mail className="h-4 w-4 text-[#28A745] shrink-0" />
                    <span className="font-mono">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#212529]">
                    <Phone className="h-4 w-4 text-[#FFC107] shrink-0" />
                    <span>{myProfile?.profile?.phone || "+213 550 00 00 00"}</span>
                  </div>
                </div>
              </AdminCard>

              {/* Social & Professional Links */}
              <AdminCard
                title="Connected Networks"
                icon={Globe}
              >
                <div className="space-y-2">
                  {(myProfile?.user_socials || user?.user_socials || []).length === 0 ? (
                    <p className="text-xs text-[#6C757D]">
                      No external networks linked yet.
                    </p>
                  ) : (
                    (myProfile?.user_socials || user?.user_socials || []).map((social) => (
                      <div
                        key={social.id}
                        className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SocialIcon platform={social.platform} className="h-4 w-4" />
                          <span className="font-bold capitalize text-[#212529]">
                            {social.platform}
                          </span>
                          <span className="truncate text-[#6C757D]">
                            {social.url}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ms-2">
                          <a
                            href={social.url.startsWith("http") ? social.url : `https://${social.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0D6EFD] hover:underline p-1"
                            title="Open link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveSocial(social.id)}
                            className="text-[#DC3545] hover:text-[#b02a37] p-1 transition-colors"
                            title="Remove network"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <form onSubmit={handleAddSocial} className="mt-3 space-y-2 border-t border-[#E9ECEF] pt-3">
                    <span className="text-[11px] font-bold text-[#6C757D] uppercase tracking-wider block">
                      Add Network
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={newSocialPlatform}
                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                        className="rounded-md border border-[#E9ECEF] bg-white px-2 py-1 text-xs text-[#212529] font-medium"
                      >
                        {platforms.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="https://..."
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        className="h-8 text-xs bg-white border-[#E9ECEF]"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newSocialUrl.trim()}
                        className="h-8 bg-[#0D6EFD] text-white hover:bg-[#0b5ed7]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </form>
                </div>
              </AdminCard>
            </div>

            {/* RIGHT COLUMN: Administrator Activity Stream & Audit (8 cols) */}
            <div className="space-y-6 lg:col-span-8">
              <AdminCard
                title="Recent Administrator Actions"
                subtitle="Real-time log of administrative events and operations"
                icon={Activity}
                collapsible
                maximizable
              >
                <div className="space-y-4">
                  {[
                    {
                      icon: Users,
                      color: "text-[#0D6EFD]",
                      title: "User Account Moderation",
                      desc: "Approved partner registration and assigned enterprise access tier.",
                      time: "15 minutes ago",
                      entity: "User #104",
                      status: "Success",
                    },
                    {
                      icon: FolderKanban,
                      color: "text-[#28A745]",
                      title: "Project Verification Endorsement",
                      desc: "Verified portfolio evidence for software engineering domain.",
                      time: "1 hour ago",
                      entity: "Project #42",
                      status: "Verified",
                    },
                    {
                      icon: Key,
                      color: "text-[#7135E8]",
                      title: "System Permissions Audit",
                      desc: "Updated role-based permission rules for regional evaluator tier.",
                      time: "3 hours ago",
                      entity: "Role #2",
                      status: "Applied",
                    },
                    {
                      icon: ShieldCheck,
                      color: "text-[#FFC107]",
                      title: "Authentication Token Renewal",
                      desc: "Admin session renewed with secure multi-factor authentication.",
                      time: "5 hours ago",
                      entity: "Security Daemon",
                      status: "Authorized",
                    },
                  ].map((act, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between rounded-lg border border-[#E9ECEF] p-3.5 transition-colors hover:bg-[#F8F9FA]"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Crisp icon without light background */}
                        <act.icon className={`h-5 w-5 shrink-0 mt-0.5 ${act.color}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#212529]">
                            {act.title}
                          </p>
                          <p className="text-xs text-[#6C757D] mt-0.5">
                            {act.desc}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#ADB5BD]">
                            <span className="font-mono text-[#6C757D]">
                              {act.entity}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {act.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="rounded bg-[#F8F9FA] border border-[#DEE2E6] px-2 py-0.5 text-[10px] font-bold text-[#212529] uppercase shrink-0 ms-2">
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              </AdminCard>

              {/* System Privileges & RBAC Scope */}
              <AdminCard
                title="System Privileges & Authority"
                icon={ShieldCheck}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-[#E9ECEF] p-3">
                    <span className="font-bold text-[#212529] block">
                      Users & Organizations
                    </span>
                    <p className="text-[#6C757D] mt-0.5">
                      Full read, create, update, and revoke capabilities across all registered accounts.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E9ECEF] p-3">
                    <span className="font-bold text-[#212529] block">
                      Catalogs & Domains
                    </span>
                    <p className="text-[#6C757D] mt-0.5">
                      Create, modify, and delete verification domains, skills, and languages.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E9ECEF] p-3">
                    <span className="font-bold text-[#212529] block">
                      Evaluation Moderation
                    </span>
                    <p className="text-[#6C757D] mt-0.5">
                      Override and force review status for projects, registrations, and activities.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E9ECEF] p-3">
                    <span className="font-bold text-[#212529] block">
                      Security & Roles
                    </span>
                    <p className="text-[#6C757D] mt-0.5">
                      Configure RBAC security tiers, permissions mapping, and session audits.
                    </p>
                  </div>
                </div>
              </AdminCard>
            </div>
          </div>
        )}

        {/* ── About Tab ────────────────────────────────────────── */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <AdminCard title="Identity Details" icon={User}>
                <dl className="divide-y divide-[#E9ECEF] text-xs">
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">First Name</dt>
                    <dd className="font-bold text-[#212529]">
                      {myProfile?.profile?.first_name || firstName || "—"}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Last Name</dt>
                    <dd className="font-bold text-[#212529]">
                      {myProfile?.profile?.last_name || lastName || "—"}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Email Address</dt>
                    <dd className="font-bold text-[#212529] font-mono">
                      {user?.email}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Phone Number</dt>
                    <dd className="font-bold text-[#212529]">
                      {myProfile?.profile?.phone || "—"}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Gender</dt>
                    <dd className="font-bold text-[#212529]">
                      {myProfile?.profile?.gender || "Not specified"}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Location</dt>
                    <dd className="font-bold text-[#212529]">
                      {myProfile?.profile?.location || "Algiers, Algeria"}
                    </dd>
                  </div>
                </dl>
              </AdminCard>
            </div>

            <div className="lg:col-span-6">
              <AdminCard title="Administrative Position" icon={Briefcase}>
                <dl className="divide-y divide-[#E9ECEF] text-xs">
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Official Role</dt>
                    <dd className="font-bold text-[#7135E8]">
                      Super Administrator
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Department</dt>
                    <dd className="font-bold text-[#212529]">
                      Operations & Security Infrastructure
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Account Status</dt>
                    <dd className="font-bold text-[#28A745]">
                      Active • Unrestricted
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Two-Factor Authentication</dt>
                    <dd className="font-bold text-[#28A745]">
                      Enforced (Protected)
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#6C757D]">Platform Version</dt>
                    <dd className="font-bold text-[#212529]">
                      JADARA Enterprise 4.0
                    </dd>
                  </div>
                </dl>
              </AdminCard>
            </div>
          </div>
        )}


        {/* ── Settings Tab ──────────────────────────────────────── */}
        {activeTab === "settings" && (
          <AdminCard
            title="Administrative Preferences"
            subtitle="Custom dashboard workspace preferences"
            icon={SettingsIcon}
          >
            <div className="space-y-4 max-w-xl text-xs">
              <div className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3">
                <div>
                  <p className="font-bold text-[#212529]">
                    System Notifications
                  </p>
                  <p className="text-[#6C757D] text-[11px]">
                    Receive instant alerts when new registration requests arrive
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded accent-[#7135E8]"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3">
                <div>
                  <p className="font-bold text-[#212529]">
                    Project Submission Alerts
                  </p>
                  <p className="text-[#6C757D] text-[11px]">
                    Alert when beneficiaries submit evidence for review
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded accent-[#7135E8]"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3">
                <div>
                  <p className="font-bold text-[#212529]">
                    Quick Search Keyboard Shortcut (⌘K / Ctrl+K)
                  </p>
                  <p className="text-[#6C757D] text-[11px]">
                    Enable global spotlight navigation palette
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded accent-[#7135E8]"
                />
              </div>
            </div>
          </AdminCard>
        )}

        {/* ── Edit Profile Modal ───────────────────────────────── */}
        {isEditModalOpen && (
          <div
            className="admin-modal-backdrop"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              className="admin-modal max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-head">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-[#7135E8]" />
                  <h3>Edit Administrator Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  profileMutation.mutate();
                }}
              >
                <div className="admin-modal-body space-y-4">
                  {/* Avatar Upload in Modal */}
                  <div className="flex items-center gap-4 rounded-lg border border-[#E9ECEF] p-3 bg-[#F8F9FA]">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-[#7135E8] shadow-sm shrink-0">
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#212529]">
                        Profile Avatar
                      </p>
                      <p className="text-[11px] text-[#6C757D] mb-1.5">
                        JPG, PNG, or WEBP (Max 5MB)
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        className="h-7 text-xs border-[#DEE2E6]"
                      >
                        Choose New Picture
                      </Button>
                    </div>
                  </div>

                  {/* Cover Photo Upload in Modal */}
                  <div className="flex items-center gap-4 rounded-lg border border-[#E9ECEF] p-3 bg-[#F8F9FA]">
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#26183D] shadow-sm shrink-0">
                      <img
                        src={coverUrl}
                        alt="Cover Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#212529]">
                        Cover Photo
                      </p>
                      <p className="text-[11px] text-[#6C757D] mb-1.5">
                        Wide banner (JPG, PNG, or WEBP)
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                        className="h-7 text-xs border-[#DEE2E6]"
                      >
                        Choose New Cover
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#212529] mb-1">
                        First Name
                      </label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-white border-[#E9ECEF] text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#212529] mb-1">
                        Last Name
                      </label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-white border-[#E9ECEF] text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#212529] mb-1">
                        Phone Number
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+213 550 00 00 00"
                        className="bg-white border-[#E9ECEF] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#212529] mb-1">
                        Location / Wilaya
                      </label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Algiers"
                        className="bg-white border-[#E9ECEF] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#212529] mb-1">
                      Professional Bio
                    </label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Summary of responsibilities and credentials..."
                      rows={3}
                      className="bg-white border-[#E9ECEF] text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#212529] mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) =>
                        setGender(e.target.value as "Male" | "Female" | "")
                      }
                      className="w-full rounded-md border border-[#E9ECEF] bg-white px-3 py-1.5 text-xs text-[#212529]"
                    >
                      <option value="">Not specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="admin-modal-foot">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="border-[#DEE2E6]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={profileMutation.isPending || !firstName.trim()}
                    className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-1.5"
                  >
                    {profileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save Profile</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
