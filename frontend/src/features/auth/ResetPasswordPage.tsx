import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/common/PasswordField";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { AuthShell } from "./AuthShell";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <AuthShell title={t("auth.resetSuccess", { defaultValue: "تمت إعادة التعيين بنجاح" })}>
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">{t("auth.resetDone")}</p>
          <Button asChild className="w-full">
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.resetPasswordTitle", { defaultValue: "كلمة مرور جديدة" })}
      subtitle={t("auth.resetPasswordSubtitle", {
        defaultValue: "أدخل كلمة مرورك الجديدة للمتابعة",
      })}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (newPassword !== confirmPassword) {
            setError(t("auth.passwordMismatch", { defaultValue: "كلمتا المرور غير متطابقتين" }));
            return;
          }
          if (newPassword.length < 6) {
            setError(
              t("auth.passwordTooShort", {
                defaultValue: "كلمة المرور قصيرة جدا (6 أحرف على الأقل)",
              }),
            );
            return;
          }
          setDone(true);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="rp-new">{t("auth.newPassword")}</Label>
          <PasswordField
            id="rp-new"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={newPassword} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp-confirm">{t("auth.confirmPassword")}</Label>
          <PasswordField
            id="rp-confirm"
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
        <p className="text-center text-sm">
          <Link to="/login" className="text-muted-foreground hover:text-primary">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
