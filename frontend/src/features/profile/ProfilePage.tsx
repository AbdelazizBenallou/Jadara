import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  CheckCircle2,
  Globe,
  Layers,
  FolderKanban,
  Sparkles,
  HeartHandshake,
  Share2,
  Languages as LanguagesIcon,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Save,
  Check,
  Award,
  ChevronDown,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SocialIcon } from "@/components/common/SocialIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import {
  getMyProfile,
  updateMyProfile,
  listSocialPlatforms,
  addMySocial,
  removeMySocial,
  getPublicProfile,
  listMyLanguages,
  createMyLanguage,
  removeMyLanguage,
} from "@/api/users";
import {
  getMySkills,
  listSkills,
  addMySkills,
  removeMySkill,
  updateMySkill,
} from "@/api/skills";
import { listDomains } from "@/api/domains";
import { listLanguages } from "@/api/languages";
import { getErrorMessage } from "@/lib/notify";
import { queryKeys } from "@/lib/query-keys";
import { WILAYAS } from "@/constants/wilayas";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import type { Role } from "@/constants/roles";
import type { SkillLevel } from "@/types/skill";
import type { LanguageProficiency } from "@/types/cv";

type ProfileTab =
  | "overview"
  | "about"
  | "skills"
  | "projects"
  | "volunteering"
  | "edit";

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const userRole = (user?.role?.toLowerCase() as Role) || "beneficiary";
  const isBeneficiary = userRole === "beneficiary";

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Avatar & Cover Uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Personal Info Form State
  const [firstName, setFirstName] = useState(user?.profile?.first_name || "");
  const [lastName, setLastName] = useState(user?.profile?.last_name || "");
  const [wilaya, setWilaya] = useState(user?.profile?.location || "");
  const [phone, setPhone] = useState(user?.profile?.phone || "");
  const [bio, setBio] = useState(user?.profile?.bio || "");
  const [dateOfBirth, setDateOfBirth] = useState<string>(
    user?.profile?.date_of_birth
      ? new Date(user.profile.date_of_birth).toISOString().split("T")[0]
      : "",
  );
  const [gender, setGender] = useState<string>(
    user?.profile?.gender
      ? user.profile.gender.charAt(0).toUpperCase() +
          user.profile.gender.slice(1).toLowerCase()
      : "",
  );

  // Primary Domain Selection State
  const [selectedDomainId, setSelectedDomainId] = useState<string>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem(`jadara_user_domain_${user?.id}`) || ""
      : "";
  });

  // Socials Management State
  const [newSocialPlatform, setNewSocialPlatform] = useState<string>("1");
  const [newSocialUrl, setNewSocialUrl] = useState<string>("");
  const [isAddingSocial, setIsAddingSocial] = useState(false);

  // Skills Management State
  const [newSkillId, setNewSkillId] = useState<string>("");
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>("beginner");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Languages Management State
  const [newLanguageId, setNewLanguageId] = useState<string>("");
  const [newLanguageProficiency, setNewLanguageProficiency] =
    useState<LanguageProficiency>("intermediate");
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);

  // ── Queries ───────────────────────────────────────────────
  const { data: myProfile, refetch: refetchMe } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMyProfile,
    staleTime: 1000 * 60 * 5,
  });

  const { data: publicProfile, refetch: refetchPublic } = useQuery({
    queryKey: queryKeys.users.profile(user?.id ?? 0),
    queryFn: () => getPublicProfile(user!.id),
    enabled: !!user?.id,
  });

  const platformsQuery = useQuery({
    queryKey: queryKeys.users.socialPlatforms,
    queryFn: listSocialPlatforms,
  });

  const skillsCatalogQuery = useQuery({
    queryKey: queryKeys.skills.list({ limit: 1000 }),
    queryFn: () => listSkills({ limit: 1000 }),
  });

  const mySkillsQuery = useQuery({
    queryKey: queryKeys.skills.mine,
    queryFn: getMySkills,
  });

  const languagesCatalogQuery = useQuery({
    queryKey: ["languages", "catalog"],
    queryFn: () => listLanguages({ limit: 100 }),
  });

  const myLanguagesQuery = useQuery({
    queryKey: ["users", "me", "languages"],
    queryFn: listMyLanguages,
  });

  const domainsCatalogQuery = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });

  // Seed form state once initial user profile arrives
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    const prof = myProfile?.profile || user?.profile;
    if (!prof) return;
    seededRef.current = true;
    setFirstName(prof.first_name || "");
    setLastName(prof.last_name || "");
    setWilaya(prof.location || "");
    setPhone(prof.phone || "");
    setBio(prof.bio || "");
    setDateOfBirth(
      prof.date_of_birth
        ? new Date(prof.date_of_birth).toISOString().split("T")[0]
        : "",
    );
    setGender(
      prof.gender
        ? prof.gender.charAt(0).toUpperCase() +
            prof.gender.slice(1).toLowerCase()
        : "",
    );
  }, [myProfile, user]);

  // Clean, deduplicated user full name
  const cleanFullName = useMemo(() => {
    const rawFirst = (
      firstName ||
      myProfile?.profile?.first_name ||
      user?.profile?.first_name ||
      user?.name ||
      "Beneficiary"
    ).trim();
    const rawLast = (
      lastName ||
      myProfile?.profile?.last_name ||
      user?.profile?.last_name ||
      ""
    ).trim();

    if (!rawLast) return rawFirst;
    if (rawFirst.toLowerCase() === rawLast.toLowerCase()) return rawFirst;
    if (rawFirst.toLowerCase().includes(rawLast.toLowerCase())) return rawFirst;
    return `${rawFirst} ${rawLast}`;
  }, [firstName, lastName, myProfile, user]);

  const initials = useMemo(() => {
    const f = (firstName || "").trim();
    const l = (lastName || "").trim();
    if (f && l && f.toLowerCase() !== l.toLowerCase()) {
      return (f.charAt(0) + l.charAt(0)).toUpperCase();
    }
    if (f) return f.charAt(0).toUpperCase();
    return "JA";
  }, [firstName, lastName]);

  const currentAvatar =
    avatarPreview ||
    myProfile?.profile?.avatar_url ||
    user?.profile?.avatar_url ||
    myProfile?.profile?.avatar ||
    user?.profile?.avatar;

  const currentCover =
    coverPreview ||
    myProfile?.profile?.cover_url ||
    user?.profile?.cover_url ||
    myProfile?.profile?.cover ||
    user?.profile?.cover ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80";

  // Registered skills & languages lists
  const currentSkills = mySkillsQuery.data || publicProfile?.user_skills || [];
  const currentLanguages =
    myLanguagesQuery.data || publicProfile?.user_languages || [];
  const currentSocials =
    publicProfile?.user_socials || user?.user_socials || [];

  // Selected domain name display
  const selectedDomain = useMemo(() => {
    if (!selectedDomainId || !domainsCatalogQuery.data) return null;
    return domainsCatalogQuery.data.find(
      (d) => String(d.id) === selectedDomainId,
    );
  }, [selectedDomainId, domainsCatalogQuery.data]);

  // Calculate completeness breakdown
  const completeness = useMemo(() => {
    const hasAvatar = !!currentAvatar;
    const hasBio = !!bio && bio.trim().length > 0;
    const hasContact = !!phone && phone.trim().length > 0;
    const hasDomain = !!selectedDomainId;
    const hasSkills = currentSkills.length > 0;
    const hasLanguages = currentLanguages.length > 0;
    const hasSocials = currentSocials.length > 0;

    const checklist = [
      {
        label: t("profile.completenessPicture", {
          defaultValue: "Profile Picture",
        }),
        done: hasAvatar,
      },
      {
        label: t("profile.completenessBio", { defaultValue: "Biography" }),
        done: hasBio,
      },
      {
        label: t("profile.completenessContact", {
          defaultValue: "Contact & Phone",
        }),
        done: hasContact,
      },
      {
        label: t("profile.completenessDomain", {
          defaultValue: "Primary Domain",
        }),
        done: hasDomain,
      },
      {
        label: t("profile.completenessSkills", {
          defaultValue: "Skills Added",
        }),
        done: hasSkills,
      },
      {
        label: t("profile.completenessLanguages", {
          defaultValue: "Languages Added",
        }),
        done: hasLanguages,
      },
      {
        label: t("profile.completenessSocials", {
          defaultValue: "Social Accounts",
        }),
        done: hasSocials,
      },
    ];

    const completed = checklist.filter((item) => item.done).length;
    const percentage = Math.round((completed / checklist.length) * 100);

    return { percentage, checklist, completed, total: checklist.length };
  }, [
    currentAvatar,
    bio,
    phone,
    selectedDomainId,
    currentSkills,
    currentLanguages,
    currentSocials,
    t,
  ]);

  // ── Immediate Avatar Upload ────────────────────────────────
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      if (firstName.trim()) formData.append("first_name", firstName.trim());
      if (lastName.trim()) formData.append("last_name", lastName.trim());
      if (wilaya.trim()) formData.append("location", wilaya.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (bio.trim()) formData.append("bio", bio.trim());

      await updateMyProfile(formData);
      const refreshed = await getMyProfile();
      updateUser({
        name: refreshed.name,
        profile: refreshed.profile,
        user_socials: refreshed.user_socials,
      });
      await refetchMe();
      if (user?.id) await refetchPublic();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(
        t("profile.avatarUploaded", {
          defaultValue: "Profile photo saved successfully!",
        }),
      );
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // ── Immediate Cover Upload ─────────────────────────────────
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (coverPreview) URL.revokeObjectURL(coverPreview);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      if (firstName.trim()) formData.append("first_name", firstName.trim());
      if (lastName.trim()) formData.append("last_name", lastName.trim());
      if (wilaya.trim()) formData.append("location", wilaya.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (bio.trim()) formData.append("bio", bio.trim());

      await updateMyProfile(formData);
      const refreshed = await getMyProfile();
      updateUser({
        name: refreshed.name,
        profile: refreshed.profile,
        user_socials: refreshed.user_socials,
      });
      await refetchMe();
      if (user?.id) await refetchPublic();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(
        t("common.saved", {
          defaultValue: "Cover photo saved successfully!",
        }),
      );
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // ── Personal Info Mutation ─────────────────────────────────
  const profileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("location", wilaya.trim());
      formData.append("phone", phone.trim());
      formData.append("bio", bio.trim());
      if (dateOfBirth)
        formData.append("date_of_birth", new Date(dateOfBirth).toISOString());
      if (gender) formData.append("gender", gender);

      await updateMyProfile(formData);

      // Persist chosen domain preference
      if (user?.id && selectedDomainId) {
        localStorage.setItem(
          `jadara_user_domain_${user.id}`,
          selectedDomainId,
        );
      }
    },
    onSuccess: async () => {
      toast.success(
        t("common.saved", {
          defaultValue: "Profile updated successfully!",
        }),
      );
      const refreshed = await getMyProfile();
      updateUser({
        name: refreshed.name,
        profile: refreshed.profile,
        user_socials: refreshed.user_socials,
      });
      await refetchMe();
      if (user?.id) await refetchPublic();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "common.error"));
    },
  });

  // ── Social Media Handlers ──────────────────────────────────
  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocialUrl.trim()) return;
    setIsAddingSocial(true);
    try {
      await addMySocial({
        platform_id: Number(newSocialPlatform),
        url: newSocialUrl.trim(),
      });
      toast.success(
        t("common.saved", {
          defaultValue: "Social account connected successfully!",
        }),
      );
      setNewSocialUrl("");
      const refreshed = await getMyProfile();
      updateUser({ user_socials: refreshed.user_socials });
      await refetchMe();
      if (user?.id) await refetchPublic();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    } finally {
      setIsAddingSocial(false);
    }
  };

  const handleRemoveSocial = async (socialId: number) => {
    try {
      await removeMySocial(socialId);
      toast.success(
        t("common.saved", {
          defaultValue: "Social link removed successfully!",
        }),
      );
      const refreshed = await getMyProfile();
      updateUser({ user_socials: refreshed.user_socials });
      await refetchMe();
      if (user?.id) await refetchPublic();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    }
  };

  // ── Skills Handlers ────────────────────────────────────────
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillId) return;
    setIsAddingSkill(true);
    try {
      await addMySkills([
        {
          skill_id: Number(newSkillId),
          level: newSkillLevel,
        },
      ]);
      toast.success(
        t("skills.added", { defaultValue: "Skill added to your profile!" }),
      );
      setNewSkillId("");
      await mySkillsQuery.refetch();
      if (user?.id) await refetchPublic();
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.mine });
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      await removeMySkill(skillId);
      toast.success(
        t("skills.removed", { defaultValue: "Skill removed from profile" }),
      );
      await mySkillsQuery.refetch();
      if (user?.id) await refetchPublic();
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.mine });
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    }
  };

  const handleUpdateSkillLevel = async (
    skillId: number,
    level: SkillLevel,
  ) => {
    try {
      await updateMySkill(skillId, { level });
      toast.success(
        t("skills.updated", { defaultValue: "Skill proficiency updated!" }),
      );
      await mySkillsQuery.refetch();
      if (user?.id) await refetchPublic();
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.mine });
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    }
  };

  // ── Languages Handlers ─────────────────────────────────────
  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLanguageId) return;
    setIsAddingLanguage(true);
    try {
      await createMyLanguage({
        language_id: Number(newLanguageId),
        proficiency: newLanguageProficiency,
      });
      toast.success(
        t("languages.added", {
          defaultValue: "Language added to your profile!",
        }),
      );
      setNewLanguageId("");
      await myLanguagesQuery.refetch();
      if (user?.id) await refetchPublic();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    } finally {
      setIsAddingLanguage(false);
    }
  };

  const handleRemoveLanguage = async (languageEntryId: number) => {
    try {
      await removeMyLanguage(languageEntryId);
      toast.success(
        t("languages.removed", {
          defaultValue: "Language removed from profile",
        }),
      );
      await myLanguagesQuery.refetch();
      if (user?.id) await refetchPublic();
    } catch (err: any) {
      toast.error(getErrorMessage(err, "common.error"));
    }
  };

  // ── Facebook-Style Navigation Tabs ─────────────────────────
  const navTabs = [
    {
      id: "overview" as ProfileTab,
      label: t("profile.tabOverview", { defaultValue: "Overview" }),
      icon: Layers,
    },
    {
      id: "about" as ProfileTab,
      label: t("profile.tabAbout", { defaultValue: "About & Contact" }),
      icon: User,
    },
    {
      id: "skills" as ProfileTab,
      label: t("profile.tabSkills", {
        defaultValue: "Skills & Qualifications",
      }),
      icon: Sparkles,
      badge: currentSkills.length,
    },
    {
      id: "projects" as ProfileTab,
      label: t("profile.tabProjects", { defaultValue: "Projects & Portfolio" }),
      icon: FolderKanban,
      badge: publicProfile?.projects?.length,
    },
    ...(isBeneficiary
      ? [
          {
            id: "volunteering" as ProfileTab,
            label: t("profile.tabVolunteering", {
              defaultValue: "Volunteering Joined",
            }),
            icon: HeartHandshake,
            badge: publicProfile?.volunteer_applications?.length,
          },
        ]
      : []),
    {
      id: "edit" as ProfileTab,
      label: t("profile.tabEdit", { defaultValue: "Edit Profile" }),
      icon: Edit3,
    },
  ];

  return (
    <DashboardLayout role={userRole} title={cleanFullName}>
      <div className="space-y-6">
        {/* ── Section 1: Facebook-Inspired Header & Cover Banner ─── */}
        <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-xs">
          {/* Cover Banner */}
          <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-gradient-to-r from-[#26183D] via-[#382451] to-[#7135E8]">
            <img
              src={currentCover}
              alt="Profile Cover"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Hidden cover input */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />

            {/* Change cover button */}
            <button
              type="button"
              disabled={isUploadingCover}
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 end-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              title="Change cover photo"
            >
              {isUploadingCover ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              <span>
                {t("profile.changeCover", { defaultValue: "Change Cover" })}
              </span>
            </button>
          </div>

          {/* Profile Header Bar */}
          <div className="relative px-4 pb-4 pt-2 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Avatar + Main Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Circular Overlapping Avatar with Camera Change Trigger */}
                <div className="relative shrink-0 -mt-16 sm:-mt-24 md:-mt-28 group">
                  <div className="h-28 w-28 sm:h-36 sm:w-36 md:h-40 md:w-40 overflow-hidden rounded-full border-4 border-white bg-[#26183D] shadow-xl ring-2 ring-[#7135E8]/30">
                    {currentAvatar ? (
                      <img
                        src={currentAvatar}
                        alt={cleanFullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#7135E8] text-3xl sm:text-4xl font-extrabold text-white shadow-inner">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Hidden avatar input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />

                  {/* Camera change trigger button overlay */}
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-1 end-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#7135E8] text-white shadow-md ring-2 ring-white transition-transform hover:scale-105 hover:bg-[#5e26cb]"
                    title="Change profile picture"
                    aria-label="Change profile picture"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Identity Information */}
                <div className="text-center sm:text-start pt-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#212529] tracking-tight">
                      {cleanFullName}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 px-2.5 py-0.5 text-xs font-bold text-[#16A34A]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="capitalize">{userRole}</span>
                    </span>
                    {selectedDomain && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#7135E8]/10 border border-[#7135E8]/20 px-2.5 py-0.5 text-xs font-bold text-[#7135E8]">
                        <Building className="h-3.5 w-3.5" />
                        <span>{selectedDomain.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Meta items: Location, Joined, Email */}
                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[#6C757D]">
                    {wilaya && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#7135E8]" />
                        <span>{wilaya}, Algeria</span>
                      </span>
                    )}
                    {user?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-[#6C757D]" />
                        <span>{user.email}</span>
                      </span>
                    )}
                    {phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-[#6C757D]" />
                        <span dir="ltr">{phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Bio quote if provided */}
                  {bio && (
                    <p className="mt-2 text-xs text-[#495057] max-w-2xl line-clamp-2 italic">
                      "{bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons (Facebook-Style Profile Controls) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 md:pt-0">
                <Button
                  onClick={() => setActiveTab("edit")}
                  className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>
                    {t("profile.editProfile", { defaultValue: "Edit Profile" })}
                  </span>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-[#E9ECEF] text-xs font-semibold text-[#212529] hover:bg-[#F8F9FA] gap-1.5"
                >
                  <Link to="/">
                    <HeartHandshake className="h-3.5 w-3.5 text-[#7135E8]" />
                    <span>
                      {t("profile.exploreMissions", {
                        defaultValue: "Explore Volunteering",
                      })}
                    </span>
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#212529]"
                  title="Share profile"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success(
                        t("profile.linkCopied", {
                          defaultValue: "Profile link copied to clipboard!",
                        }),
                      );
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Profile Completeness Strip */}
            <div className="mt-6 border-t border-[#E9ECEF] pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#212529]">
                    {t("profile.completeness", {
                      defaultValue: "Profile Readiness",
                    })}
                    :
                  </span>
                  <span className="text-xs font-extrabold text-[#7135E8]">
                    {completeness.percentage}%
                  </span>
                  <span className="text-[11px] text-[#6C757D]">
                    ({completeness.completed} / {completeness.total}{" "}
                    {t("common.stepsCompleted", { defaultValue: "completed" })})
                  </span>
                </div>
                {completeness.percentage < 100 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="text-xs font-bold text-[#7135E8] hover:underline text-start"
                  >
                    +{" "}
                    {t("profile.completeProfile", {
                      defaultValue: "Complete remaining items",
                    })}
                  </button>
                )}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E9ECEF]">
                <div
                  className="h-full rounded-full bg-[#7135E8] transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="mt-4 flex overflow-x-auto border-t border-[#E9ECEF] pt-1 scrollbar-none gap-1">
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap",
                      isActive
                        ? "border-[#7135E8] text-[#7135E8]"
                        : "border-transparent text-[#6C757D] hover:border-[#ADB5BD] hover:text-[#212529]",
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                          isActive
                            ? "bg-[#7135E8] text-white"
                            : "bg-[#F8F9FA] text-[#6C757D] border border-[#E9ECEF]",
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section 2: Tab Contents ───────────────────────────── */}

        {/* ── Tab: Overview (Facebook 2-Column Feed Layout) ──────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Intro & Quick Details Card */}
            <div className="space-y-6 lg:col-span-4">
              {/* Intro Card */}
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#212529]">
                  {t("profile.introTitle", { defaultValue: "Intro & About" })}
                </h3>

                {bio ? (
                  <p className="text-xs text-[#495057] leading-relaxed">
                    {bio}
                  </p>
                ) : (
                  <p className="text-xs text-[#6C757D] italic">
                    {t("profile.noBio", {
                      defaultValue:
                        "No bio written yet. Add a summary to introduce yourself.",
                    })}
                  </p>
                )}

                <div className="border-t border-[#E9ECEF] pt-3 space-y-2.5 text-xs">
                  {selectedDomain && (
                    <div className="flex items-center gap-2.5 text-[#495057]">
                      <Building className="h-4 w-4 text-[#7135E8] shrink-0" />
                      <span>
                        {t("profile.primaryDomain", {
                          defaultValue: "Domain",
                        })}
                        : <strong>{selectedDomain.name}</strong>
                      </span>
                    </div>
                  )}

                  {wilaya && (
                    <div className="flex items-center gap-2.5 text-[#495057]">
                      <MapPin className="h-4 w-4 text-[#7135E8] shrink-0" />
                      <span>
                        {t("profile.livesIn", { defaultValue: "Lives in" })}{" "}
                        <strong>{wilaya}, Algeria</strong>
                      </span>
                    </div>
                  )}

                  {phone && (
                    <div className="flex items-center gap-2.5 text-[#495057]">
                      <Phone className="h-4 w-4 text-[#7135E8] shrink-0" />
                      <span dir="ltr">
                        <strong>{phone}</strong>
                      </span>
                    </div>
                  )}

                  {user?.email && (
                    <div className="flex items-center gap-2.5 text-[#495057]">
                      <Mail className="h-4 w-4 text-[#7135E8] shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}

                  {currentLanguages.length > 0 && (
                    <div className="flex items-center gap-2.5 text-[#495057]">
                      <LanguagesIcon className="h-4 w-4 text-[#7135E8] shrink-0" />
                      <span className="capitalize">
                        {currentLanguages
                          .map((l) => l.languages?.name || "Language")
                          .slice(0, 3)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Media Links with Real Brand Icons */}
                {currentSocials.length > 0 && (
                  <div className="border-t border-[#E9ECEF] pt-3">
                    <h4 className="text-[11px] font-bold text-[#6C757D] uppercase tracking-wider mb-2">
                      {t("profile.socialLinks", {
                        defaultValue: "Social Accounts",
                      })}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentSocials.map((social) => (
                        <a
                          key={social.id}
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-[#E9ECEF] bg-white px-2.5 py-1 text-xs text-[#212529] hover:border-[#7135E8] hover:text-[#7135E8] transition-colors"
                          title={social.platform}
                        >
                          <SocialIcon
                            platform={social.platform}
                            className="h-3.5 w-3.5"
                          />
                          <span className="capitalize font-semibold text-[11px]">
                            {social.platform}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setActiveTab("edit")}
                  variant="outline"
                  className="w-full border-[#E9ECEF] text-xs font-semibold text-[#7135E8] hover:bg-[#7135E8]/10 hover:text-[#7135E8]"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {t("profile.editDetails", {
                      defaultValue: "Edit Details & Skills",
                    })}
                  </span>
                </Button>
              </div>

              {/* Skills Highlights Widget */}
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#212529]">
                    {t("profile.skills", { defaultValue: "Skills" })}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="text-xs font-bold text-[#7135E8] hover:underline"
                  >
                    + {t("common.add", { defaultValue: "Add" })}
                  </button>
                </div>
                {currentSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {currentSkills.slice(0, 10).map((s) => (
                      <span
                        key={s.id}
                        className="rounded-md border border-[#E9ECEF] bg-[#F8F9FA] px-2 py-1 text-xs font-semibold text-[#495057]"
                      >
                        {s.skills?.name || s.name || `Skill #${s.skill_id}`}
                      </span>
                    ))}
                    {currentSkills.length > 10 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("skills")}
                        className="rounded-md px-2 py-1 text-xs font-bold text-[#7135E8] hover:underline"
                      >
                        +{currentSkills.length - 10} more
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#6C757D]">
                    {t("profile.noSkillsAdded", {
                      defaultValue:
                        "No skills listed yet. Add skills to showcase your expertise.",
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Timeline / Activity Highlights */}
            <div className="space-y-6 lg:col-span-8">
              {/* Volunteering Joined Highlights */}
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#212529]">
                      {t("profile.recentVolunteering", {
                        defaultValue: "Volunteering Joined & Missions",
                      })}
                    </h3>
                    <p className="text-xs text-[#6C757D]">
                      {t("profile.volunteeringHistoryDesc", {
                        defaultValue:
                          "Recent community activities and volunteering contributions.",
                      })}
                    </p>
                  </div>
                  <Link to="/">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E9ECEF] text-xs text-[#7135E8]"
                    >
                      {t("profile.browseMore", {
                        defaultValue: "Browse Feed",
                      })}
                    </Button>
                  </Link>
                </div>

                {publicProfile?.volunteer_applications &&
                publicProfile.volunteer_applications.length > 0 ? (
                  <div className="space-y-3">
                    {publicProfile.volunteer_applications
                      .slice(0, 4)
                      .map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#E9ECEF] p-3.5 transition-colors hover:border-[#7135E8]"
                        >
                          <div>
                            <Link
                              to="/volunteering/activities/$activityId"
                              params={{ activityId: String(app.activity.id) }}
                              className="text-xs font-bold text-[#212529] hover:text-[#7135E8] hover:underline"
                            >
                              {app.activity.title}
                            </Link>
                            <p className="text-[11px] text-[#6C757D] mt-0.5">
                              {app.activity.organization?.name || "NGO Partner"}{" "}
                              • {app.activity.location || "Algeria"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                                app.status === "accepted"
                                  ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                                  : app.status === "pending"
                                  ? "bg-[#F5B51B]/15 text-[#B45309] border border-[#F5B51B]/30"
                                  : "bg-[#6C757D]/10 text-[#6C757D] border border-[#6C757D]/20",
                              )}
                            >
                              {app.status}
                            </span>
                            <Link
                              to="/volunteering/activities/$activityId"
                              params={{ activityId: String(app.activity.id) }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-[#7135E8]"
                              >
                                {t("common.view", { defaultValue: "View" })}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[#6C757D]">
                    <HeartHandshake className="mx-auto h-8 w-8 text-[#ADB5BD] mb-2" />
                    <p>
                      {t("profile.noVolunteeringYet", {
                        defaultValue:
                          "You haven't joined any volunteering activities yet.",
                      })}
                    </p>
                    <Link to="/">
                      <Button className="mt-3 bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs">
                        {t("profile.exploreFeed", {
                          defaultValue: "Explore Community Missions",
                        })}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Portfolio Projects Highlights */}
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#212529]">
                      {t("profile.projectsTitle", {
                        defaultValue: "Portfolio & Verified Projects",
                      })}
                    </h3>
                    <p className="text-xs text-[#6C757D]">
                      {t("profile.projectsSubtitle", {
                        defaultValue:
                          "Showcase of your practical projects and proof-of-work.",
                      })}
                    </p>
                  </div>
                  <Link to="/dashboard/projects/new">
                    <Button
                      size="sm"
                      className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("common.add", { defaultValue: "Add" })}</span>
                    </Button>
                  </Link>
                </div>

                {publicProfile?.projects &&
                publicProfile.projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {publicProfile.projects.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-[#E9ECEF] p-4 hover:border-[#7135E8] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#212529]">
                            {p.title}
                          </h4>
                          <StatusBadge status={p.status || "draft"} />
                        </div>
                        <p className="text-[11px] text-[#6C757D] line-clamp-2 mt-1 leading-relaxed">
                          {p.description || "No description provided."}
                        </p>
                        <div className="mt-3 pt-2 border-t border-[#E9ECEF] flex items-center justify-between text-[10px] text-[#6C757D]">
                          <span>
                            {p.created_at ? formatDate(p.created_at) : ""}
                          </span>
                          <Link
                            to="/dashboard/projects/$id"
                            params={{ id: String(p.id) }}
                            className="font-bold text-[#7135E8] hover:underline"
                          >
                            {t("common.view", { defaultValue: "Details" })} →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[#6C757D]">
                    <FolderKanban className="mx-auto h-8 w-8 text-[#ADB5BD] mb-2" />
                    <p>
                      {t("profile.noProjectsYet", {
                        defaultValue: "No portfolio projects added yet.",
                      })}
                    </p>
                    <Link to="/dashboard/projects/new">
                      <Button className="mt-3 bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs">
                        {t("profile.createProject", {
                          defaultValue: "Create First Project",
                        })}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: About & Contact ──────────────────────────────── */}
        {activeTab === "about" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <AdminCard
                title={t("profile.contactInfo", {
                  defaultValue: "Contact Information",
                })}
                icon={Phone}
              >
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-[#7135E8] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#212529]">
                        {t("common.email", { defaultValue: "Email" })}
                      </p>
                      <p className="text-[#6C757D]">{user?.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-[#7135E8] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#212529]">
                        {t("common.phone", { defaultValue: "Phone Number" })}
                      </p>
                      <p className="text-[#6C757D]" dir="ltr">
                        {phone || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#7135E8] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#212529]">
                        {t("profile.wilaya", {
                          defaultValue: "Wilaya / Location",
                        })}
                      </p>
                      <p className="text-[#6C757D]">
                        {wilaya ? `${wilaya}, Algeria` : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </AdminCard>

              {/* Personal Details */}
              <AdminCard
                title={t("profile.personalDetails", {
                  defaultValue: "Personal Details",
                })}
                icon={User}
              >
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-[#7135E8] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#212529]">
                        {t("profile.birthDate", {
                          defaultValue: "Date of Birth",
                        })}
                      </p>
                      <p className="text-[#6C757D]">
                        {dateOfBirth
                          ? formatDate(dateOfBirth)
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-[#7135E8] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#212529]">
                        {t("profile.gender", { defaultValue: "Gender" })}
                      </p>
                      <p className="text-[#6C757D]">
                        {gender || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#7135E8] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#212529]">
                        {t("profile.memberSince", {
                          defaultValue: "Member Since",
                        })}
                      </p>
                      <p className="text-[#6C757D]">
                        {publicProfile?.created_at
                          ? formatDate(publicProfile.created_at)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </AdminCard>
            </div>

            {/* Social Accounts Card */}
            <AdminCard
              title={t("profile.socialLinks", {
                defaultValue: "Connected Social Networks",
              })}
              icon={Globe}
            >
              {currentSocials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentSocials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-3 text-xs hover:border-[#7135E8] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <SocialIcon
                          platform={social.platform}
                          className="h-4 w-4"
                        />
                        <span className="font-bold text-[#212529] capitalize">
                          {social.platform}
                        </span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-[#6C757D]" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6C757D] text-center py-4">
                  {t("profile.noSocials", {
                    defaultValue: "No social accounts connected yet.",
                  })}
                </p>
              )}
            </AdminCard>
          </div>
        )}

        {/* ── Tab: Skills & Qualifications ──────────────────────── */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#212529]">
                  {t("profile.skillsQualifications", {
                    defaultValue: "Skills & Qualifications",
                  })}
                </h3>
                <p className="text-xs text-[#6C757D]">
                  {t("profile.skillsDesc", {
                    defaultValue:
                      "Technical and soft skills verified on the JADARA platform.",
                  })}
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("edit")}
                className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {t("profile.manageSkillsBtn", {
                    defaultValue: "Add / Manage Skills",
                  })}
                </span>
              </Button>
            </div>

            {currentSkills.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {currentSkills.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-xs"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#212529]">
                        {s.skills?.name || s.name || `Skill #${s.skill_id}`}
                      </h4>
                      <p className="text-[11px] text-[#6C757D] capitalize mt-0.5">
                        {t(`skills.level_${s.level}`, { defaultValue: s.level })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                        s.level === "expert"
                          ? "bg-[#7135E8]/10 text-[#7135E8] border border-[#7135E8]/20"
                          : s.level === "advanced"
                          ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                          : s.level === "intermediate"
                          ? "bg-[#F5B51B]/15 text-[#B45309] border border-[#F5B51B]/30"
                          : "bg-[#6C757D]/10 text-[#6C757D] border border-[#6C757D]/20",
                      )}
                    >
                      {s.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-12 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
                <h3 className="text-sm font-bold text-[#212529]">
                  {t("profile.noSkillsTitle", {
                    defaultValue: "No skills registered yet",
                  })}
                </h3>
                <p className="text-xs text-[#6C757D] mt-1 max-w-sm mx-auto">
                  {t("profile.noSkillsSubtitle", {
                    defaultValue:
                      "Adding skills helps organizations discover you for volunteering missions and projects.",
                  })}
                </p>
                <Button
                  onClick={() => setActiveTab("edit")}
                  className="mt-4 bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("profile.addSkillsNow", {
                    defaultValue: "Add Skills in Edit Profile",
                  })}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Projects & Portfolio ─────────────────────────── */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#212529]">
                  {t("profile.portfolioTitle", {
                    defaultValue: "Projects & Portfolio",
                  })}
                </h3>
                <p className="text-xs text-[#6C757D]">
                  {t("profile.projectsSubtitle", {
                    defaultValue:
                      "Showcase of your verified work, code repositories, and achievements.",
                  })}
                </p>
              </div>
              <Link to="/dashboard/projects/new">
                <Button className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>
                    {t("profile.createNewProject", {
                      defaultValue: "Add Project",
                    })}
                  </span>
                </Button>
              </Link>
            </div>

            {publicProfile?.projects && publicProfile.projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {publicProfile.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs hover:border-[#7135E8] transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-bold text-[#212529]">
                          {project.title}
                        </h4>
                        <StatusBadge status={project.status || "draft"} />
                      </div>
                      <p className="text-xs text-[#6C757D] mt-2 line-clamp-3 leading-relaxed">
                        {project.description ||
                          t("common.noDescription", {
                            defaultValue: "No project description provided.",
                          })}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#E9ECEF] pt-3 text-[11px] text-[#6C757D]">
                      <span>
                        {project.created_at
                          ? formatDate(project.created_at)
                          : "N/A"}
                      </span>
                      <Link
                        to="/dashboard/projects/$id"
                        params={{ id: String(project.id) }}
                        className="font-bold text-[#7135E8] hover:underline"
                      >
                        {t("common.viewDetails", {
                          defaultValue: "View Project",
                        })}{" "}
                        →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-12 text-center">
                <FolderKanban className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
                <h3 className="text-sm font-bold text-[#212529]">
                  {t("profile.noProjectsYet", {
                    defaultValue: "No projects in your portfolio yet",
                  })}
                </h3>
                <p className="text-xs text-[#6C757D] mt-1 max-w-sm mx-auto">
                  {t("profile.noProjectsDesc", {
                    defaultValue:
                      "Add projects to build proof-of-competence and stand out to organizations and companies.",
                  })}
                </p>
                <Link to="/dashboard/projects/new">
                  <Button className="mt-4 bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("profile.createNewProject", {
                      defaultValue: "Create Your First Project",
                    })}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Volunteering Joined ──────────────────────────── */}
        {activeTab === "volunteering" && isBeneficiary && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#212529]">
                {t("profile.volunteeringTitle", {
                  defaultValue: "Volunteering Joined & Missions",
                })}
              </h3>
              <p className="text-xs text-[#6C757D]">
                {t("profile.volunteeringSubtitle", {
                  defaultValue:
                    "Community volunteering activities and initiatives you have participated in.",
                })}
              </p>
            </div>

            {publicProfile?.volunteer_applications &&
            publicProfile.volunteer_applications.length > 0 ? (
              <div className="space-y-3">
                {publicProfile.volunteer_applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-xs hover:border-[#7135E8] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/volunteering/activities/$activityId"
                          params={{ activityId: String(app.activity.id) }}
                          className="text-sm font-bold text-[#212529] hover:text-[#7135E8] hover:underline"
                        >
                          {app.activity.title}
                        </Link>
                        {app.activity.category && (
                          <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold text-[#6C757D]">
                            {app.activity.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6C757D]">
                        {app.activity.organization?.name || "NGO Partner"} •{" "}
                        {app.activity.location || "Algeria"}
                      </p>
                      <p className="text-[11px] text-[#6C757D]">
                        Applied on {formatDate(app.application_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold capitalize",
                          app.status === "accepted"
                            ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                            : app.status === "pending"
                            ? "bg-[#F5B51B]/15 text-[#B45309] border border-[#F5B51B]/30"
                            : "bg-[#6C757D]/10 text-[#6C757D] border border-[#6C757D]/20",
                        )}
                      >
                        {app.status}
                      </span>
                      <Link
                        to="/volunteering/activities/$activityId"
                        params={{ activityId: String(app.activity.id) }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#E9ECEF] text-[#7135E8]"
                        >
                          {t("common.viewDetails", {
                            defaultValue: "View Activity",
                          })}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E9ECEF] bg-white p-12 text-center">
                <HeartHandshake className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
                <h3 className="text-sm font-bold text-[#212529]">
                  {t("profile.noVolunteeringYet", {
                    defaultValue: "No volunteering missions joined yet",
                  })}
                </h3>
                <p className="text-xs text-[#6C757D] mt-1 max-w-sm mx-auto">
                  {t("profile.noVolunteeringDesc", {
                    defaultValue:
                      "Discover open volunteering opportunities from verified NGOs on the JADARA homepage.",
                  })}
                </p>
                <Link to="/">
                  <Button className="mt-4 bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs">
                    {t("profile.exploreMissions", {
                      defaultValue: "Explore Missions Feed",
                    })}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Complete Facebook-Style Edit Profile Hub ──────── */}
        {activeTab === "edit" && (
          <div className="space-y-6">
            {/* Top Info Banner */}
            <div className="rounded-xl border border-[#7135E8]/20 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#212529]">
                  {t("profile.editHubTitle", {
                    defaultValue: "Comprehensive Profile Editor",
                  })}
                </h3>
                <p className="text-xs text-[#6C757D]">
                  {t("profile.editHubSubtitle", {
                    defaultValue:
                      "Manage your personal information, primary domain, skills catalog, spoken languages, and social links.",
                  })}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setActiveTab("overview")}
                variant="outline"
                className="border-[#E9ECEF] text-xs font-semibold text-[#7135E8]"
              >
                ←{" "}
                {t("profile.backToProfile", {
                  defaultValue: "View Profile",
                })}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column (8 cols): Personal Info + Domain */}
              <div className="space-y-6 lg:col-span-8">
                {/* 1. Personal Information Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    profileMutation.mutate();
                  }}
                >
                  <AdminCard
                    title={t("profile.personalInfo", {
                      defaultValue: "Personal Information",
                    })}
                    icon={User}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="firstName"
                          className="text-xs font-semibold text-[#212529]"
                        >
                          {t("profile.firstName", {
                            defaultValue: "First Name",
                          })}
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="border-[#E9ECEF] text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="lastName"
                          className="text-xs font-semibold text-[#212529]"
                        >
                          {t("profile.lastName", {
                            defaultValue: "Last Name",
                          })}
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="border-[#E9ECEF] text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="phone"
                          className="text-xs font-semibold text-[#212529]"
                        >
                          {t("common.phone", {
                            defaultValue: "Phone Number",
                          })}
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+213 555 12 34 56"
                          dir="ltr"
                          className="border-[#E9ECEF] text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="wilaya"
                          className="text-xs font-semibold text-[#212529]"
                        >
                          {t("profile.wilaya", {
                            defaultValue: "Wilaya / Location",
                          })}
                        </Label>
                        <Select
                          value={wilaya}
                          onValueChange={setWilaya}
                          dir={isRtl ? "rtl" : "ltr"}
                        >
                          <SelectTrigger className="border-[#E9ECEF] text-xs">
                            <SelectValue
                              placeholder={t("profile.selectWilaya", {
                                defaultValue: "Select a wilaya",
                              })}
                            />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            side="bottom"
                            className="max-h-[220px] overflow-y-auto"
                          >
                            {WILAYAS.map((w) => (
                              <SelectItem key={w} value={w} className="text-xs">
                                <span dir="ltr">{w}</span> -{" "}
                                <span>
                                  {t(`wilayas.${w}`, { defaultValue: w })}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="birthDate"
                          className="text-xs font-semibold text-[#212529]"
                        >
                          {t("profile.birthDate", {
                            defaultValue: "Date of Birth",
                          })}
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          dir="ltr"
                          className="border-[#E9ECEF] text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-[#212529]">
                          {t("profile.gender", { defaultValue: "Gender" })}
                        </Label>
                        <RadioGroup
                          value={gender}
                          onValueChange={setGender}
                          className="flex items-center gap-6 pt-2"
                          dir={isRtl ? "rtl" : "ltr"}
                        >
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="Male" id="gender-male" />
                            <Label
                              htmlFor="gender-male"
                              className="text-xs font-normal cursor-pointer"
                            >
                              {t("profile.genderMale", {
                                defaultValue: "Male",
                              })}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="Female" id="gender-female" />
                            <Label
                              htmlFor="gender-female"
                              className="text-xs font-normal cursor-pointer"
                            >
                              {t("profile.genderFemale", {
                                defaultValue: "Female",
                              })}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label
                          htmlFor="bio"
                          className="text-xs font-semibold text-[#212529]"
                        >
                          {t("profile.bio", {
                            defaultValue:
                              "Biography & Professional Summary",
                          })}
                        </Label>
                        <Textarea
                          id="bio"
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder={t("profile.bioPlaceholder", {
                            defaultValue:
                              "Write a short summary about your background, skills, and aspirations...",
                          })}
                          className="border-[#E9ECEF] text-xs leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-3 border-t border-[#E9ECEF] pt-4">
                      <Button
                        type="submit"
                        disabled={profileMutation.isPending}
                        className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
                      >
                        {profileMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>
                          {t("common.save", {
                            defaultValue: "Save Personal Info",
                          })}
                        </span>
                      </Button>
                    </div>
                  </AdminCard>
                </form>

                {/* 2. Primary Domain & Specialization */}
                <AdminCard
                  title={t("profile.domainCardTitle", {
                    defaultValue: "Primary Domain & Specialization",
                  })}
                  icon={Building}
                >
                  <div className="space-y-4">
                    <p className="text-xs text-[#6C757D]">
                      {t("profile.domainDescription", {
                        defaultValue:
                          "Select the primary domain or field of expertise that represents your main area of volunteering and skill development.",
                      })}
                    </p>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#212529]">
                        {t("profile.chooseDomain", {
                          defaultValue: "Select Domain",
                        })}
                      </Label>
                      <Select
                        value={selectedDomainId}
                        onValueChange={(val) => {
                          setSelectedDomainId(val);
                          if (user?.id) {
                            localStorage.setItem(
                              `jadara_user_domain_${user.id}`,
                              val,
                            );
                            toast.success(
                              t("profile.domainSaved", {
                                defaultValue: "Primary domain updated!",
                              }),
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="border-[#E9ECEF] text-xs">
                          <SelectValue
                            placeholder={t("profile.selectDomainPlaceholder", {
                              defaultValue: "Choose your primary domain...",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {(domainsCatalogQuery.data ?? []).map((domain) => (
                            <SelectItem
                              key={domain.id}
                              value={String(domain.id)}
                              className="text-xs"
                            >
                              <span className="font-semibold">{domain.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDomain && (
                      <div className="rounded-lg border border-[#7135E8]/20 bg-[#7135E8]/5 p-3 text-xs text-[#495057]">
                        <p className="font-bold text-[#7135E8]">
                          {selectedDomain.name}
                        </p>
                        <p className="text-[11px] text-[#6C757D] mt-0.5">
                          {selectedDomain.description ||
                            "Focus area for volunteer assignments, certifications, and recommendations."}
                        </p>
                      </div>
                    )}
                  </div>
                </AdminCard>

                {/* 3. Technical Skills Manager (Direct in Profile) */}
                <AdminCard
                  title={t("profile.manageSkillsTitle", {
                    defaultValue: "Technical & Professional Skills",
                  })}
                  icon={Sparkles}
                >
                  <div className="space-y-5">
                    {/* Current Skills List */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-[#212529]">
                        {t("profile.yourRegisteredSkills", {
                          defaultValue: "Your Active Skills",
                        })}{" "}
                        ({currentSkills.length})
                      </Label>

                      {currentSkills.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentSkills.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2.5 bg-white text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-[#212529] truncate">
                                  {s.skills?.name ||
                                    s.name ||
                                    `Skill #${s.skill_id}`}
                                </p>
                                <Select
                                  value={s.level}
                                  onValueChange={(val) =>
                                    handleUpdateSkillLevel(
                                      s.id || s.skill_id,
                                      val as SkillLevel,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-6 text-[10px] border-[#E9ECEF] px-1.5 py-0 mt-1 capitalize">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value="beginner"
                                      className="text-xs"
                                    >
                                      Beginner
                                    </SelectItem>
                                    <SelectItem
                                      value="intermediate"
                                      className="text-xs"
                                    >
                                      Intermediate
                                    </SelectItem>
                                    <SelectItem
                                      value="advanced"
                                      className="text-xs"
                                    >
                                      Advanced
                                    </SelectItem>
                                    <SelectItem
                                      value="expert"
                                      className="text-xs"
                                    >
                                      Expert
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSkill(s.id || s.skill_id)
                                }
                                aria-label="Remove skill"
                                className="rounded p-1 text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#6C757D] text-center py-3 border border-dashed border-[#E9ECEF] rounded-lg">
                          {t("profile.noSkillsAddedYet", {
                            defaultValue:
                              "No skills added yet. Use the form below to add skills to your profile.",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Add New Skill Form */}
                    <form
                      onSubmit={handleAddSkill}
                      className="rounded-lg border border-[#E9ECEF] bg-[#F8F9FA] p-4 space-y-3"
                    >
                      <h4 className="text-xs font-bold text-[#212529]">
                        +{" "}
                        {t("profile.addNewSkill", {
                          defaultValue: "Add Skill to Profile",
                        })}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8 space-y-1">
                          <Label className="text-[11px] text-[#6C757D]">
                            {t("skills.selectSkill", {
                              defaultValue: "Choose Skill",
                            })}
                          </Label>
                          <Select
                            value={newSkillId}
                            onValueChange={setNewSkillId}
                          >
                            <SelectTrigger className="border-[#E9ECEF] bg-white text-xs">
                              <SelectValue
                                placeholder={t("skills.searchPlaceholder", {
                                  defaultValue: "Select a skill from catalog...",
                                })}
                              />
                            </SelectTrigger>
                            <SelectContent className="max-h-[220px]">
                              {(skillsCatalogQuery.data ?? []).map((sk) => (
                                <SelectItem
                                  key={sk.id}
                                  value={String(sk.id)}
                                  className="text-xs"
                                >
                                  {sk.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px] text-[#6C757D]">
                            {t("skills.proficiencyLevel", {
                              defaultValue: "Proficiency",
                            })}
                          </Label>
                          <Select
                            value={newSkillLevel}
                            onValueChange={(val) =>
                              setNewSkillLevel(val as SkillLevel)
                            }
                          >
                            <SelectTrigger className="border-[#E9ECEF] bg-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner" className="text-xs">
                                Beginner
                              </SelectItem>
                              <SelectItem
                                value="intermediate"
                                className="text-xs"
                              >
                                Intermediate
                              </SelectItem>
                              <SelectItem value="advanced" className="text-xs">
                                Advanced
                              </SelectItem>
                              <SelectItem value="expert" className="text-xs">
                                Expert
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          disabled={isAddingSkill || !newSkillId}
                          className="bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
                        >
                          {isAddingSkill ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {t("skills.addSkillBtn", {
                              defaultValue: "Add Skill",
                            })}
                          </span>
                        </Button>
                      </div>
                    </form>
                  </div>
                </AdminCard>
              </div>

              {/* Right Column (4 cols): Languages + Socials */}
              <div className="space-y-6 lg:col-span-4">
                {/* 4. Spoken Languages Manager */}
                <AdminCard
                  title={t("profile.manageLanguages", {
                    defaultValue: "Spoken Languages",
                  })}
                  icon={LanguagesIcon}
                >
                  <div className="space-y-4">
                    {/* Current Languages List */}
                    <div className="space-y-2">
                      {currentLanguages.length > 0 ? (
                        currentLanguages.map((l) => (
                          <div
                            key={l.id}
                            className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2.5 bg-white text-xs"
                          >
                            <div>
                              <p className="font-bold text-[#212529]">
                                {l.languages?.name || "Language"}
                              </p>
                              <p className="text-[11px] text-[#7135E8] font-semibold capitalize mt-0.5">
                                {l.proficiency}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLanguage(l.id)}
                              aria-label="Remove language"
                              className="rounded p-1 text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#6C757D] text-center py-2">
                          {t("profile.noLanguages", {
                            defaultValue: "No languages added yet.",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Add Language Form */}
                    <form
                      onSubmit={handleAddLanguage}
                      className="border-t border-[#E9ECEF] pt-4 space-y-3"
                    >
                      <h4 className="text-xs font-bold text-[#212529]">
                        +{" "}
                        {t("profile.addLanguage", {
                          defaultValue: "Add Language",
                        })}
                      </h4>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-[#6C757D]">
                          {t("profile.language", {
                            defaultValue: "Language",
                          })}
                        </Label>
                        <Select
                          value={newLanguageId}
                          onValueChange={setNewLanguageId}
                        >
                          <SelectTrigger className="border-[#E9ECEF] text-xs">
                            <SelectValue
                              placeholder={t("profile.selectLanguage", {
                                defaultValue: "Select language...",
                              })}
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-[220px]">
                            {(languagesCatalogQuery.data ?? []).map((lang) => (
                              <SelectItem
                                key={lang.id}
                                value={String(lang.id)}
                                className="text-xs"
                              >
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-[#6C757D]">
                          {t("profile.proficiency", {
                            defaultValue: "Proficiency",
                          })}
                        </Label>
                        <Select
                          value={newLanguageProficiency}
                          onValueChange={(val) =>
                            setNewLanguageProficiency(val as LanguageProficiency)
                          }
                        >
                          <SelectTrigger className="border-[#E9ECEF] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner" className="text-xs">
                              Beginner (A1/A2)
                            </SelectItem>
                            <SelectItem
                              value="intermediate"
                              className="text-xs"
                            >
                              Intermediate (B1/B2)
                            </SelectItem>
                            <SelectItem value="advanced" className="text-xs">
                              Advanced (C1)
                            </SelectItem>
                            <SelectItem value="fluent" className="text-xs">
                              Fluent (C2)
                            </SelectItem>
                            <SelectItem value="native" className="text-xs">
                              Native Speaker
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="submit"
                        disabled={isAddingLanguage || !newLanguageId}
                        className="w-full bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
                      >
                        {isAddingLanguage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {t("profile.addLanguageBtn", {
                            defaultValue: "Add Language",
                          })}
                        </span>
                      </Button>
                    </form>
                  </div>
                </AdminCard>

                {/* 5. Social Media Manager */}
                <AdminCard
                  title={t("profile.manageSocials", {
                    defaultValue: "Social Media Accounts",
                  })}
                  icon={Globe}
                >
                  <div className="space-y-4">
                    {/* Existing Socials */}
                    <div className="space-y-2">
                      {currentSocials.length > 0 ? (
                        currentSocials.map((social) => (
                          <div
                            key={social.id}
                            className="flex items-center justify-between rounded-lg border border-[#E9ECEF] p-2.5 bg-white text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <SocialIcon
                                platform={social.platform}
                                className="h-4 w-4 shrink-0"
                              />
                              <span className="font-bold text-[#212529] capitalize truncate">
                                {social.platform}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocial(social.id)}
                              aria-label="Remove social account"
                              className="rounded p-1 text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#6C757D] text-center py-2">
                          {t("profile.noSocials", {
                            defaultValue: "No social media links connected.",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Add new social */}
                    <form
                      onSubmit={handleAddSocial}
                      className="space-y-3 border-t border-[#E9ECEF] pt-4"
                    >
                      <h4 className="text-xs font-bold text-[#212529]">
                        +{" "}
                        {t("profile.addSocialLink", {
                          defaultValue: "Add Social Account",
                        })}
                      </h4>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-[#6C757D]">
                          {t("profile.selectPlatform", {
                            defaultValue: "Platform",
                          })}
                        </Label>
                        <Select
                          value={newSocialPlatform}
                          onValueChange={setNewSocialPlatform}
                        >
                          <SelectTrigger className="border-[#E9ECEF] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(platformsQuery.data ?? []).map((p) => (
                              <SelectItem
                                key={p.id}
                                value={String(p.id)}
                                className="text-xs"
                              >
                                <span className="capitalize">{p.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-[#6C757D]">
                          {t("profile.profileUrl", {
                            defaultValue: "Profile URL",
                          })}
                        </Label>
                        <Input
                          value={newSocialUrl}
                          onChange={(e) => setNewSocialUrl(e.target.value)}
                          placeholder="https://..."
                          dir="ltr"
                          className="border-[#E9ECEF] text-xs"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isAddingSocial || !newSocialUrl.trim()}
                        className="w-full bg-[#7135E8] text-white hover:bg-[#5e26cb] text-xs font-semibold gap-1.5"
                      >
                        {isAddingSocial ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {t("profile.addSocialLink", {
                            defaultValue: "Connect Account",
                          })}
                        </span>
                      </Button>
                    </form>
                  </div>
                </AdminCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
