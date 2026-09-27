import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Github, Linkedin, Globe, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { WILAYAS } from "@/constants/wilayas";
import type { Role } from "@/constants/roles";

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user, updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const userRole = (user?.role?.toLowerCase() as Role) || "beneficiary";

  // Avatar state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Local form state seeded from persistent MockDb profile
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
      ? user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1).toLowerCase()
      : "",
  );

  const getSocialUrl = useCallback(
    (platform: string) => user?.user_socials?.find((s) => s.platform === platform)?.url || "",
    [user?.user_socials],
  );
  const [linkedinUrl, setLinkedinUrl] = useState(getSocialUrl("linkedin"));
  const [githubUrl, setGithubUrl] = useState(getSocialUrl("github"));
  const [portfolioUrl, setPortfolioUrl] = useState(getSocialUrl("portfolio"));

  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (fName: string, lName: string) => {
    const regex = /^[a-zA-Z\s'-]*$/;
    if (!regex.test(fName) || !regex.test(lName)) {
      setNameError(t("profile.latinNamesOnly"));
    } else {
      setNameError("");
    }
  };

  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    validateName(val, lastName || "");
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    validateName(firstName || "", val);
  };

  // Seed form state ONCE when the initial user profile data arrives from AuthContext.
  // We must NOT re-seed on every user change — that would overwrite user edits and
  // cleared values every time updateUser() is called after a save.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return; // Already seeded — never re-run
    if (!user?.profile) return;    // Data not yet available — wait
    seededRef.current = true;
    setFirstName(user.profile.first_name || "");
    setLastName(user.profile.last_name || "");
    setWilaya(user.profile.location || "");
    setPhone(user.profile.phone || "");
    setBio(user.profile.bio || "");
    setDateOfBirth(
      user.profile.date_of_birth
        ? new Date(user.profile.date_of_birth).toISOString().split("T")[0]
        : "",
    );
    setGender(
      user.profile.gender
        ? user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1).toLowerCase()
        : "",
    );
    if (user?.user_socials) {
      setLinkedinUrl(getSocialUrl("linkedin"));
      setGithubUrl(getSocialUrl("github"));
      setPortfolioUrl(getSocialUrl("portfolio"));
    }
  }, [user, getSocialUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <DashboardLayout role={userRole} title={t("profile.title")}>
      <form
        className="mx-auto max-w-3xl space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (nameError) return;
          setIsSubmitting(true);

          let profileSuccess = false;
          try {
            // Update Profile
            const formData = new FormData();
            formData.append("first_name", firstName);
            formData.append("last_name", lastName);
            formData.append("location", wilaya);
            formData.append("phone", phone);
            formData.append("bio", bio);
            // gender and date_of_birth use strict backend validation (enum / date type).
            // Omit entirely when empty so the backend preserves the current value.
            if (dateOfBirth) formData.append("date_of_birth", new Date(dateOfBirth).toISOString());
            if (gender) formData.append("gender", gender);
            if (avatarFile) formData.append("avatar", avatarFile);

            await apiClient.patch("/users/me/profile", formData);
            profileSuccess = true;
          } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to update profile";
            toast.error(msg);

            // Revert avatar preview on failure so it doesn't look saved
            if (avatarPreview) {
              URL.revokeObjectURL(avatarPreview);
              setAvatarPreview(null);
              setAvatarFile(null);
              if (avatarInputRef.current) avatarInputRef.current.value = "";
            }
          }

          let socialSuccess = true;
          try {
            // Handle Socials
            const platforms = [
              { name: "linkedin", url: linkedinUrl },
              { name: "github", url: githubUrl },
              { name: "portfolio", url: portfolioUrl },
            ];

            for (const p of platforms) {
              const existing = user?.user_socials?.find((s) => s.platform === p.name);

              if (p.url !== existing?.url) {
                // Changed or cleared
                if (p.url) {
                  await apiClient.post("/users/me/socials", {
                    platform: p.name,
                    url: p.url,
                  });
                } else if (existing) {
                  await apiClient.delete(`/users/me/socials/${existing.id}`);
                }
              }
            }
          } catch (error: any) {
            socialSuccess = false;
            const msg = error.response?.data?.message || "Failed to update social links";
            toast.error(msg);

            // Revert social links state to what's in context
            setLinkedinUrl(getSocialUrl("linkedin"));
            setGithubUrl(getSocialUrl("github"));
            setPortfolioUrl(getSocialUrl("portfolio"));
          }

          if (profileSuccess || socialSuccess) {
            try {
              const profileRes = await apiClient.get("/users/me/profile");
              const backendProfile =
                profileRes.data?.data?.profiles || profileRes.data?.data?.profile || {};
              const newSocials = profileRes.data?.data?.user_socials || [];

              const fetchedFirstName = 'first_name' in backendProfile ? (backendProfile.first_name as string ?? "") : (user?.profile?.first_name || "");
              const fetchedLastName = 'last_name' in backendProfile ? (backendProfile.last_name as string ?? "") : (user?.profile?.last_name || "");
              const newName = `${fetchedFirstName} ${fetchedLastName}`.trim() || user?.email?.split("@")[0] || "";

              updateUser({
                name: newName,
                profile: {
                  ...user?.profile,
                  first_name: fetchedFirstName,
                  last_name: fetchedLastName,
                  location: 'location' in backendProfile ? backendProfile.location : (user?.profile?.location || null),
                  phone: 'phone' in backendProfile ? backendProfile.phone : (user?.profile?.phone || null),
                  bio: 'bio' in backendProfile ? backendProfile.bio : (user?.profile?.bio || null),
                  date_of_birth: 'date_of_birth' in backendProfile ? (backendProfile.date_of_birth ? new Date(backendProfile.date_of_birth).toISOString() : null) : (user?.profile?.date_of_birth || null),
                  gender: 'gender' in backendProfile ? backendProfile.gender : (user?.profile?.gender || null),
                  avatar: 'avatar' in backendProfile ? backendProfile.avatar : (user?.profile?.avatar || null),
                  avatar_url: 'avatar_url' in backendProfile ? backendProfile.avatar_url : (user?.profile?.avatar_url || null),
                },
                user_socials: newSocials,
              });

              if (profileSuccess && socialSuccess) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
                toast.success(t("common.saved"));
              }
            } catch (error) {
              console.error("Failed to sync profile after update", error);
            }
          }

          setIsSubmitting(false);
        }}
      >
        {/* ── Avatar & identity ─────────────────────────────── */}
        <div className="flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-soft">
          <div className="relative">
            {avatarPreview || user?.profile?.avatar_url ? (
              <img
                src={avatarPreview || user?.profile?.avatar_url || undefined}
                alt={user?.name ?? "Avatar"}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-white">
                {(() => {
                  const f = (firstName || "").trim();
                  const l = (lastName || "").trim();
                  if (f && l) return (f.charAt(0) + l.charAt(0)).toUpperCase();
                  if (f) return f.charAt(0).toUpperCase();
                  if (l) return l.charAt(0).toUpperCase();
                  return "JA";
                })()}
              </span>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept=".jpg,.png"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary shadow-soft hover:bg-muted transition-colors"
              aria-label={t("profile.changePhoto")}
              title={t("profile.changePhoto")}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="text-lg font-bold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email || "amina@example.dz"}</p>
          </div>
        </div>

        {/* ── About / Professional Information ──────────────────────────── */}
        <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:grid-cols-2">
          <p className="font-bold sm:col-span-2">{t("profile.personalInfo")}</p>
          <div className="space-y-2">
            <Label>{t("profile.firstName")}</Label>
            <Input
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              dir="auto"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.lastName")}</Label>
            <Input
              value={lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              dir="auto"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.birthDate")}</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.gender")}</Label>
            <RadioGroup
              value={gender}
              onValueChange={setGender}
              className="flex items-center gap-6 pt-2"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="Male" id="gender-male" />
                <Label htmlFor="gender-male" className="font-normal cursor-pointer">
                  {t("profile.genderMale")}
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="Female" id="gender-female" />
                <Label htmlFor="gender-female" className="font-normal cursor-pointer">
                  {t("profile.genderFemale")}
                </Label>
              </div>
            </RadioGroup>
          </div>
          {nameError && (
            <p className="sm:col-span-2 text-sm font-medium text-destructive">{nameError}</p>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("profile.bio")}</Label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>

        {/* ── Contact & Location ──────────────────────────────────────── */}
        <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:grid-cols-2">
          <p className="font-bold sm:col-span-2">{t("profile.contactLocation")}</p>
          <div className="space-y-2">
            <Label>{t("common.phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.wilaya")}</Label>
            <Select value={wilaya} onValueChange={setWilaya} dir={isRtl ? "rtl" : "ltr"}>
              <SelectTrigger>
                <SelectValue placeholder={t("profile.selectWilaya")} />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                className="max-h-[220px] overflow-y-auto"
              >
                {WILAYAS.map((w) => (
                  <SelectItem key={w} value={w}>
                    <div className="flex w-full items-center">
                      <span className="min-w-[24px] text-muted-foreground" dir="ltr">
                        {w}
                      </span>
                      <span className="mx-2 text-muted-foreground">-</span>
                      <span className="truncate">{t(`wilayas.${w}`)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── External links ────────────────────────────────── */}
        <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:grid-cols-2">
          <p className="font-bold sm:col-span-2">{t("profile.links")}</p>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Linkedin className="h-4 w-4 text-primary" /> LinkedIn
            </Label>
            <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Github className="h-4 w-4 text-primary" /> GitHub
            </Label>
            <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" /> {t("profile.portfolioUrl")}
            </Label>
            <Input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              dir="ltr"
              placeholder="https://myportfolio.com"
            />
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!!nameError}>
            {t("common.save")}
          </Button>
          {saved && <p className="text-sm font-medium text-success">{t("common.saved")}</p>}
        </div>
      </form>
    </DashboardLayout>
  );
}
