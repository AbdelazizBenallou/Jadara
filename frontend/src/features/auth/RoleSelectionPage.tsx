import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthShell } from "./AuthShell";
import { UserCircle, Briefcase, CheckCircle } from "lucide-react";

export function RoleSelectionPage() {
  const { t } = useTranslation();

  return (
    <AuthShell
      title={t("auth.selectRoleTitle", { defaultValue: "Choose your role" })}
      subtitle={t("auth.selectRoleSubtitle", { defaultValue: "Select how you want to use JADARA" })}
    >
      <div className="flex flex-col gap-4 mt-2">
        <Link
          to="/register/beneficiary"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 text-start">
            <h3 className="font-semibold text-foreground">
              {t("roles.beneficiary", { defaultValue: "Beneficiary" })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("auth.roleBenDesc", { defaultValue: "Prove your skills and find opportunities" })}
            </p>
          </div>
        </Link>

        <Link
          to="/register/reviewer"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 text-start">
            <h3 className="font-semibold text-foreground">
              {t("roles.reviewer", { defaultValue: "Reviewer" })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("auth.roleRevDesc", { defaultValue: "Verify skills and guide talent" })}
            </p>
          </div>
        </Link>

        <Link
          to="/register/company"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1 text-start">
            <h3 className="font-semibold text-foreground">
              {t("roles.company", { defaultValue: "Company" })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("auth.roleCompDesc", { defaultValue: "Discover verified talent" })}
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount", { defaultValue: "Already have an account?" })}{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          {t("auth.loginBtn", { defaultValue: "Log in" })}
        </Link>
      </div>
    </AuthShell>
  );
}
