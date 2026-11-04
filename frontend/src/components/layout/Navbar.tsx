import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const isAbout = location.pathname === "/about";
  const onDark = false;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkBase =
    "text-sm font-medium transition-colors duration-300 inline-block";
  const linkTone = onDark
    ? "text-white/65 hover:text-white"
    : "text-home-muted-text hover:text-home-brand";
  const activeTone = onDark ? "text-white" : "text-home-brand";
  const navAction = "h-10 rounded-full px-5 text-sm font-semibold shadow-none";
  const navLogin = `${navAction} border-home-border bg-transparent text-home-main-text hover:border-home-brand/30 hover:bg-home-soft-purple hover:text-home-brand`;
  const navRegister = `${navAction} border-transparent bg-home-brand text-white shadow-[0_10px_24px_-12px_rgba(91,36,122,0.65)] hover:bg-home-brand/90 hover:shadow-[0_14px_30px_-14px_rgba(91,36,122,0.7)]`;

  const publicLinks = (
    <>
      <Link
        to="/"
        className={`${linkBase} ${linkTone}`}
        activeProps={{ className: `${linkBase} ${activeTone}` }}
        onClick={() => setOpen(false)}
      >
        {t("nav.home")}
      </Link>
      <Link
        to="/about"
        className={`${linkBase} ${linkTone}`}
        activeProps={{ className: `${linkBase} ${activeTone}` }}
        onClick={() => setOpen(false)}
      >
        {t("nav.about")}
      </Link>
      <Link
        to="/faq"
        className={`${linkBase} ${linkTone}`}
        activeProps={{ className: `${linkBase} ${activeTone}` }}
        onClick={() => setOpen(false)}
      >
        {t("nav.faq")}
      </Link>
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 lg:px-6 lg:pt-4">
      <div
        className={`relative mx-auto flex h-16 w-full items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:h-[72px] lg:max-w-7xl lg:rounded-[25px] lg:px-8 ${
          onDark
            ? "bg-transparent"
            : isAbout
              ? "border-b border-home-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-lg lg:border"
              : "border-b border-home-border/50 bg-home-surface/95 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-lg lg:border"
        }`}
      >
        <Link to="/" className="relative z-10 flex items-center gap-2">
          {language === "ar" && !onDark ? (
            <img src="/images/logo_ar.png" alt="جدارة" className="h-8" />
          ) : (
            <span
              className={`font-display text-xl font-bold tracking-tight ${
                onDark ? "text-white" : "text-home-primary-dark"
              }`}
            >
              JADARA
            </span>
          )}
        </Link>

        <nav className="relative z-10 hidden items-center gap-7 lg:flex">
          {publicLinks}
        </nav>

        <div className="relative z-10 flex items-center gap-2">
          <LanguageSwitcher inverted={onDark} />
          {user ? (
            <>
              {ROLE_HOME[user.role] &&
                ROLE_HOME[user.role] !== "/unsupported" && (
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: ROLE_HOME[user.role] })}
                    className={navRegister}
                  >
                    {t("nav.dashboard")}
                  </Button>
                )}
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className={`${navAction} px-4 text-home-main-text hover:bg-home-soft-purple hover:text-home-brand`}
              >
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className={`${navLogin} hidden sm:inline-flex`}
              >
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild variant="outline" className={navRegister}>
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-home-main-text hover:bg-home-soft-purple hover:text-home-brand lg:hidden"
            onClick={() => setOpen(!open)}
          >
            <span
              aria-hidden="true"
              className="material-icons-round text-[22px] leading-none"
            >
              {open ? "close" : "menu"}
            </span>
          </Button>
        </div>
      </div>
      {open && (
        <nav
          className={`mx-4 mt-2 flex flex-col gap-4 rounded-[25px] border px-6 py-5 shadow-md lg:hidden ${
            onDark
              ? "border-white/10 bg-[#1e1a26]"
              : isAbout
                ? "border-home-border bg-white"
                : "border-home-border bg-home-surface"
          }`}
        >
          {publicLinks}
          {!user && (
            <div className="border-t border-home-border/70 pt-2 sm:hidden">
              <Button
                asChild
                variant="outline"
                className={`${navLogin} w-full`}
              >
                <Link to="/login" onClick={() => setOpen(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
