import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/common/PasswordField";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { useAuth } from "@/context/AuthContext";
import { AuthShell } from "./AuthShell";
import { apiClient } from "@/api/client";

export function BeneficiaryRegisterPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("auth.passwordMismatch", { defaultValue: "كلمتا المرور غير متطابقتين" }));
      return;
    }
    if (password.length < 6) {
      setError(
        t("auth.passwordTooShort", { defaultValue: "كلمة المرور قصيرة جدا (6 أحرف على الأقل)" }),
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const rolesRes = await apiClient.get("/roles");
      const roles = rolesRes.data.data as { id: number; name: string }[];
      const benRole = roles.find((r) => r.name.toLowerCase() === "beneficiary");

      if (!benRole) throw new Error("Beneficiary role not found on server");

      const names = name.trim().split(" ");
      const first_name = names[0] || "Unknown";
      const last_name = names.slice(1).join(" ") || "Unknown";

      await apiClient.post("/auth/register", {
        email,
        password,
        first_name,
        last_name,
        role_id: benRole.id,
      });

      await login({ email, password });
      navigate({ to: "/dashboard" }); // Wait, onboarding is removed, go to dashboard
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message || t("auth.invalidCredentials"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.beneficiaryRegTitle", { defaultValue: "حساب مستفيد جديد" })}
      subtitle={t("auth.beneficiaryRegSubtitle", {
        defaultValue: "أنشئ حسابك لتبدأ توثيق مهاراتك",
      })}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="ben-name">{t("auth.fullName")}</Label>
          <Input
            id="ben-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amina Benyoucef"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-email">{t("common.email")}</Label>
          <Input
            id="ben-email"
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-password">{t("auth.password")}</Label>
          <PasswordField
            id="ben-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-confirm">{t("auth.confirmPassword")}</Label>
          <PasswordField
            id="ben-confirm"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.loading")
            : t("auth.createBeneficiary", { defaultValue: "إنشاء حساب مستفيد" })}
        </Button>
        <p className="text-center text-sm text-muted-foreground pt-4">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("auth.loginBtn")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
