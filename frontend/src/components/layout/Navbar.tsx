import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ROLE_HOME } from "@/constants/roles";

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isHome = location.pathname === "/";

  const publicLinks = (
    <>
      <Link
        to="/"
        className="text-sm font-medium text-home-muted-text transition-all duration-300 hover:text-home-brand hover:scale-[1.03] inline-block"
        activeProps={{ className: "text-sm font-medium text-home-brand" }}
        onClick={() => setOpen(false)}
      >
        {t("nav.home")}
      </Link>
      <Link
        to="/about"
        className="text-sm font-medium text-home-muted-text transition-all duration-300 hover:text-home-brand hover:scale-[1.03] inline-block"
        activeProps={{ className: "text-sm font-medium text-home-brand" }}
        onClick={() => setOpen(false)}
      >
        {t("nav.about")}
      </Link>
      <Link
        to="/faq"
        className="text-sm font-medium text-home-muted-text transition-all duration-300 hover:text-home-brand hover:scale-[1.03] inline-block"
        activeProps={{ className: "text-sm font-medium text-home-brand" }}
        onClick={() => setOpen(false)}
      >
        {t("nav.faq")}
      </Link>
    </>
  );

  return (
    <header className="fixed top-0 left-0 w-full z-50 lg:pt-4">
      {/* Smooth Blur/Fade Transition for scrolling content */}
      <div
        className="absolute top-0 left-0 w-full h-[100px] pointer-events-none -z-30 bg-home-primary-dark/[0.03]"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 80%, transparent 100%)",
        }}
      />
      <div className="mx-auto flex items-center justify-between relative h-16 px-4 lg:rounded-[24px] lg:max-w-[1000px] lg:px-8 w-full">
        {/* Scrolled Pill Background Color & Soft Shadow */}
        <div className="absolute inset-0 -z-20 bg-home-surface/95 backdrop-blur-lg shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] border-b lg:border border-home-border/40 lg:rounded-[24px]" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          {language === "ar" ? (
            <img src="/images/logo_ar.png" alt="جدارة" className="h-8" />
          ) : (
            <span className="text-xl font-bold font-display text-home-primary-dark tracking-tight">
              JADARA
            </span>
          )}
        </Link>

        <nav className="hidden items-center relative z-10 lg:flex gap-6">{publicLinks}</nav>

        <div className="flex items-center gap-2 relative z-10">
          <LanguageSwitcher />
          {user ? (
            <>
              {ROLE_HOME[user.role] && ROLE_HOME[user.role] !== "/unsupported" && (
                <Button
                  size="sm"
                  onClick={() => navigate({ to: ROLE_HOME[user.role] })}
                  className="bg-home-brand text-home-surface hover:bg-home-brand/90 border-none transition-all"
                >
                  {t("nav.dashboard")}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="text-home-main-text hover:text-home-brand hover:bg-home-soft-purple transition-all"
              >
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="hidden sm:inline-flex text-home-main-text hover:text-home-brand hover:bg-home-soft-purple transition-all"
              >
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-home-brand text-home-surface hover:bg-home-brand/90 border-none transition-all"
              >
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-home-main-text hover:text-home-brand hover:bg-home-soft-purple"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 border-t bg-background px-6 py-4 lg:hidden shadow-md">
          {publicLinks}
        </nav>
      )}
    </header>
  );
}
