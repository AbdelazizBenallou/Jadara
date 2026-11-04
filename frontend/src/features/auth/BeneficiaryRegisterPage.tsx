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
import { register } from "@/api/auth";
import { listRoles } from "@/api/roles";
import { getErrorMessage } from "@/lib/notify";
import { toast } from "sonner";
import { isStrongPassword } from "@/lib/utils";

export function BeneficiaryRegisterPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(
        t("auth.passwordMismatch", {
          defaultValue: "كلمتا المرور غير متطابقتين",
        }),
      );
      return;
    }
    if (password.length < 8) {
      toast.error(
        t("auth.passwordTooShort8", {
          defaultValue: "Password must be at least 8 characters",
        }),
      );
      return;
    }
    if (!isStrongPassword(password)) {
      toast.error(
        t("auth.passwordWeak", {
          defaultValue:
            "Password must contain an uppercase letter, a lowercase letter and a number",
        }),
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const roles = await listRoles();
      const benRole = roles.find((r) => r.name.toLowerCase() === "beneficiary");

      if (!benRole) throw new Error("Beneficiary role not found on server");

      const names = name.trim().split(" ");
      const first_name = names[0] || "Unknown";
      const last_name = names.slice(1).join(" ") || "Unknown";

      await register({
        email,
        password,
        first_name,
        last_name,
        role_id: benRole.id,
      });

      await login({ email, password });
      toast.success(
        t("auth.beneficiaryCreated", {
          defaultValue: "Account created successfully",
        }),
      );
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(getErrorMessage(err, "auth.invalidCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      backToRoleSelection
      title={t("auth.beneficiaryRegTitle", {
        defaultValue: "حساب مستفيد جديد",
      })}
      subtitle={t("auth.beneficiaryRegSubtitle", {
        defaultValue: "أنشئ حسابك لتبدأ توثيق مهاراتك",
      })}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="ben-name">{t("auth.fullName")}</Label>
          <Input
            id="ben-name"
            icon="person"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-email">{t("common.email")}</Label>
          <Input
            id="ben-email"
            icon="mail"
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-password">{t("auth.password")}</Label>
          <PasswordField
            id="ben-password"
            icon="lock"
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
            icon="lock"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.loading")
            : t("auth.createBeneficiary", {
                defaultValue: "إنشاء حساب مستفيد",
              })}
        </Button>
        <p className="text-center text-sm text-muted-foreground pt-4">
          {t("auth.haveAccount")}{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            {t("auth.loginBtn")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
