import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          {language === "ar" ? (
            <img src="/images/logo_ar.png" alt="جدارة" className="h-8" />
          ) : (
            <span className="text-xl font-bold font-display text-primary tracking-tight">
              JADARA
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
        </div>
      </div>
      {/* Static soft radial purple glow — §25.4 recipe, NO animation */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at center, rgba(153,57,198,0.12) 0%, transparent 55%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-elegant">
          <h1 className="text-2xl font-extrabold text-foreground font-display">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
