import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PasswordField } from "@/components/common/PasswordField";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { submitRegistrationDemand } from "@/api/registration-demands";
import { getErrorMessage } from "@/lib/notify";
import { isStrongPassword } from "@/lib/utils";
import { AuthShell } from "./AuthShell";

type Step = 1 | 2;

export function OrganizationRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [contactName, setContactName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const validatePassword = () => {
    if (password.length < 8) {
      toast.error(
        t("auth.passwordTooShort8", {
          defaultValue: "Password must be at least 8 characters",
        }),
      );
      return false;
    }
    if (!isStrongPassword(password)) {
      toast.error(
        t("auth.passwordWeak", {
          defaultValue:
            "Password must contain an uppercase letter, a lowercase letter and a number",
        }),
      );
      return false;
    }
    if (password !== confirm) {
      toast.error(
        t("auth.passwordMismatch", { defaultValue: "Passwords do not match" }),
      );
      return false;
    }
    return true;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !organizationName.trim()) {
      toast.error(
        t("organization.requiredFields", {
          defaultValue: "Organization name and contact name are required",
        }),
      );
      return;
    }
    if (!file) {
      toast.error(
        t("auth.documentRequired", {
          defaultValue: "A supporting document is required",
        }),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const names = contactName.trim().split(/\s+/);
      const firstName = names[0] || "Unknown";
      const lastName = names.slice(1).join(" ") || "Unknown";

      const formData = new FormData();
      formData.append("role", "Organization");
      formData.append("email", email);
      formData.append("password", password);
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      if (phone.trim()) formData.append("phone", phone.trim());
      formData.append(
        "organization",
        JSON.stringify({
          name: organizationName.trim(),
          description: description.trim() || undefined,
          website: website.trim() || undefined,
          email,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
        }),
      );
      formData.append("files", file);

      await submitRegistrationDemand(formData);

      toast.success(
        t("auth.demandSubmitted", {
          defaultValue: "Request submitted successfully",
        }),
      );
      setIsSubmitted(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthShell title={t("organization.pendingTitle")}>
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <span
            aria-hidden="true"
            className="material-icons-round mb-2 text-[56px] leading-none text-success"
          >
            check_circle
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("organization.pendingDesc")}
          </p>
          <Button onClick={() => navigate({ to: "/" })} className="mt-6 w-full">
            {t("common.backToHome", { defaultValue: "Back to Home" })}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      backToRoleSelection
      title={t("organization.regTitle")}
      subtitle={t("organization.regSubtitle")}
    >
      <div className="mb-6 grid grid-cols-2 gap-3 text-xs">
        <div
          className={
            step >= 1
              ? "border-b-2 border-primary pb-2 font-semibold text-primary"
              : "border-b-2 border-border pb-2 text-muted-foreground"
          }
        >
          1. {t("organization.stepAccount")}
        </div>
        <div
          className={
            step >= 2
              ? "border-b-2 border-primary pb-2 font-semibold text-primary"
              : "border-b-2 border-border pb-2 text-muted-foreground"
          }
        >
          2. {t("organization.stepDetails")}
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={step === 1 ? handleNext : handleSubmit}
      >
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="org-email">{t("common.email")}</Label>
              <Input
                id="org-email"
                icon="mail"
                type="email"
                required
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-password">{t("auth.password")}</Label>
              <PasswordField
                id="org-password"
                icon="lock"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-confirm">{t("auth.confirmPassword")}</Label>
              <PasswordField
                id="org-confirm"
                icon="lock"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="mt-2 w-full">
              {t("organization.nextBtn")}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="org-contact">
                {t("organization.contactName")}
              </Label>
              <Input
                id="org-contact"
                icon="person"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-name">{t("organization.orgName")}</Label>
              <Input
                id="org-name"
                icon="business"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-description">
                {t("organization.description")}
              </Label>
              <Textarea
                id="org-description"
                icon="notes"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-phone">{t("common.phone")}</Label>
                <Input
                  id="org-phone"
                  icon="call"
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-location">{t("common.location")}</Label>
                <Input
                  id="org-location"
                  icon="location_on"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-website">{t("organization.website")}</Label>
              <Input
                id="org-website"
                icon="language"
                type="url"
                dir="ltr"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("organization.uploadDoc")}</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-transparent p-6 transition-colors hover:border-primary/40"
                onClick={() => document.getElementById("org-file")?.click()}
              >
                <span
                  aria-hidden="true"
                  className="material-icons-round mb-2 text-[32px] leading-none text-primary"
                >
                  upload_file
                </span>
                <p className="text-center text-sm text-muted-foreground">
                  {file ? file.name : t("organization.uploadHelper")}
                </p>
                <input
                  id="org-file"
                  type="file"
                  required
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/3"
                onClick={() => setStep(1)}
              >
                {t("common.back", { defaultValue: "Back" })}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.loading")
                  : t("organization.submitReg")}
              </Button>
            </div>
          </>
        )}
      </form>

      {step === 1 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t("auth.haveAccount", { defaultValue: "Already have an account?" })}{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            {t("auth.loginBtn", { defaultValue: "Log in" })}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
