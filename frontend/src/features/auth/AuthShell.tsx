import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export function AuthShell({
  title,
  subtitle,
  backToRoleSelection = false,
  children,
}: {
  title: string;
  subtitle?: string;
  backToRoleSelection?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <div className="grid bg-white lg:min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col bg-primary px-6 py-8 text-primary-foreground sm:px-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:px-14 lg:py-10">
        <Link to="/" className="inline-flex w-fit items-center">
          {language === "ar" ? (
            <img
              src="/images/logo_ar.png"
              alt="جدارة"
              className="h-11 brightness-0 invert"
            />
          ) : (
            <span className="font-display text-2xl font-bold tracking-tight">
              JADARA
            </span>
          )}
        </Link>

        <div className="my-auto max-w-md py-12 lg:py-0">
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {t("brand.tagline")}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-primary-foreground/75 sm:text-base sm:leading-8">
            {t("footer.desc")}
          </p>
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span
              aria-hidden="true"
              className="material-icons-round text-base text-primary lg:hidden"
            >
              {language === "ar" ? "arrow_forward" : "arrow_back"}
            </span>
            {language === "ar" ? (
              <img
                src="/images/logo_ar.png"
                alt="جدارة"
                className="h-8 lg:hidden"
              />
            ) : (
              <span className="font-display text-lg font-bold tracking-tight text-foreground lg:hidden">
                JADARA
              </span>
            )}
            <span className="hidden lg:inline">{t("nav.home")}</span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-4 sm:px-10">
          <div className="w-full max-w-md">
            {backToRoleSelection && (
              <Link
                to="/register"
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <span
                  aria-hidden="true"
                  className="material-icons-round text-[16px] leading-none"
                >
                  {language === "ar" ? "arrow_forward" : "arrow_back"}
                </span>
                {t("auth.chooseAnotherRole", {
                  defaultValue: "Choose another role",
                })}
              </Link>
            )}
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {subtitle}
              </p>
            )}
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <footer className="border-t border-border px-6 py-5 sm:px-10">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} JADARA</p>
            <nav className="flex items-center gap-4" aria-label="Footer">
              <Link to="/" className="transition-colors hover:text-foreground">
                {t("nav.home")}
              </Link>
              <Link
                to="/faq"
                className="transition-colors hover:text-foreground"
              >
                {t("nav.faq")}
              </Link>
              <Link
                to="/about"
                className="transition-colors hover:text-foreground"
              >
                {t("nav.about")}
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
