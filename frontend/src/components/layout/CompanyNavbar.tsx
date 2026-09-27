import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export function CompanyNavbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/company" className="flex items-center gap-2">
            {language === "ar" ? (
              <img src="/images/logo_ar.png" alt="جدارة" className="h-8" />
            ) : (
              <span className="text-xl font-bold font-display text-primary tracking-tight">
                JADARA
              </span>
            )}
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              to="/company"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {t("company.discoverTalent", { defaultValue: "Discover Talent" })}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <div className="hidden md:flex items-center gap-3 border-l pl-4 rtl:border-r rtl:border-l-0 rtl:pr-4">
            <div className="flex flex-col items-end rtl:items-start text-sm">
              <span className="font-bold">
                {user?.profile?.first_name
                  ? `${user.profile.first_name} ${user.profile.last_name || ""}`
                  : user?.name}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{t("roles.company")}</span>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold">
              {(user?.profile?.first_name || user?.name || "C").charAt(0).toUpperCase()}
            </div>
          </div>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
          >
            <Link
              to="/dashboard/settings"
              title={t("sidebar.settings", { defaultValue: "Settings" })}
            >
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            title={t("nav.logout", { defaultValue: "Logout" })}
          >
            <LogOut className="h-5 w-5 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </header>
  );
}
