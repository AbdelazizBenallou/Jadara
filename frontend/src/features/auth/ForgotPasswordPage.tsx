import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MailCheck, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/common/PasswordField";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { cn } from "@/lib/utils";
import { AuthShell } from "./AuthShell";

type ForgotStep = 1 | 2 | 3 | 4;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<ForgotStep>(1);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const steps = [t("auth.step1"), t("auth.step2"), t("auth.step3")];

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch", { defaultValue: "كلمتا المرور غير متطابقتين" }));
      return;
    }
    if (newPassword.length < 6) {
      setError(
        t("auth.passwordTooShort", { defaultValue: "كلمة المرور قصيرة جدا (6 أحرف على الأقل)" }),
      );
      return;
    }
    setStep(4);
  };

  return (
    <AuthShell title={t("auth.forgotTitle")}>
      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                step > i
                  ? "bg-primary text-primary-foreground"
                  : step === i + 1
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > i + 1 ? "✓" : i + 1}
            </span>
            <span className="text-center text-xs text-muted-foreground hidden sm:block">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Enter email */}
      {step === 1 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="forgot-email">{t("common.email")}</Label>
            <Input
              id="forgot-email"
              type="email"
              required
              dir="ltr"
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="w-full">
            {t("auth.sendCode")}
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              {t("auth.backToLogin")}
            </Link>
          </p>
        </form>
      )}

      {/* Step 2: Check email */}
      {step === 2 && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-info/15">
            <MailCheck className="h-8 w-8 text-info" />
          </div>
          <div>
            <p className="font-semibold">
              {t("auth.codeSentTitle", { defaultValue: "تحقق من بريدك الإلكتروني" })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.codeSent")}</p>
          </div>
          <Button className="w-full" onClick={() => setStep(3)}>
            {t("auth.continue")}
          </Button>
        </div>
      )}

      {/* Step 3: New password */}
      {step === 3 && (
        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
            <PasswordField
              id="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordStrength password={newPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
            <PasswordField
              id="confirm-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <Button type="submit" className="w-full">
            {t("auth.resetBtn")}
          </Button>
        </form>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <p className="font-semibold">
              {t("auth.resetSuccess", { defaultValue: "تمت إعادة التعيين بنجاح" })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.resetDone")}</p>
          </div>
          <Button asChild className="w-full">
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
