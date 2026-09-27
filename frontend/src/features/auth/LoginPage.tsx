import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/common/PasswordField";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME, type Role } from "@/constants/roles";

import { AuthShell } from "./AuthShell";

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // The role state is just for UI/demo convenience to auto-fill (optional),
      // but the real login only takes email/password.
      const loggedInUser = await login({ email, password });

      if (loggedInUser && loggedInUser.role) {
        // Map backend role (e.g. 'Admin', 'Beneficiary') to frontend route constants
        const roleKey = loggedInUser.role.toLowerCase() as Role;
        navigate({ to: ROLE_HOME[roleKey] || "/dashboard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg(t("auth.invalidCredentials"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="login-email">{t("common.email")}</Label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t("auth.password")}</Label>
            <a
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
              tabIndex={-1}
            >
              {t("auth.forgotPassword")}
            </a>
          </div>
          <PasswordField
            id="login-password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>


        {/* Error */}
        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("common.loading") : t("auth.signIn")}
        </Button>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t("auth.createAccount")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
