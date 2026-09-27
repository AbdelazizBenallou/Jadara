import { Link, useLocation } from "@tanstack/react-router";
import { Facebook, Instagram, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ReactNode, useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { useLanguage } from "@/context/LanguageContext";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.19 1.11 1.22 2.62 1.96 4.2 2.22v3.74c-1.89-.04-3.71-.85-5.06-2.18-.08.71-.1 1.43-.1 2.14v6.1c-.02 2.34-1.12 4.59-3.05 5.92-2.24 1.54-5.32 1.67-7.7 0-2.3-1.61-3.46-4.63-2.9-7.41.48-2.39 2.36-4.39 4.77-4.87.87-.17 1.77-.13 2.62.11v3.9c-.83-.34-1.77-.3-2.54.14-1.1.61-1.68 1.9-1.42 3.14.23 1.14 1.2 2.01 2.36 2.07 1.51.08 2.85-1 2.98-2.5.02-.27.01-.54.01-.81V.02z" />
  </svg>
);

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const location = useLocation();
  const [showScroll, setShowScroll] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    /* Continuous light gradient — white → brand-50 → brand-100 → brand-200 */
    <div className="flex min-h-screen flex-col bg-home-page-bg text-home-main-text">
      <Navbar />

      <main className={`flex-1 ${!isHome ? "pt-24 lg:pt-32" : ""}`}>{children}</main>

      {/* Footer — seamless light continuation, no divider line from CTA */}
      <footer className="pt-16 pb-10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Brand & Socials */}
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center min-h-[56px]">
              {language === "ar" ? (
                <img src="/images/logo_ar.png" alt="جدارة" className="h-14 opacity-90" />
              ) : (
                <span className="text-3xl font-bold font-display text-home-primary-dark tracking-tight">
                  JADARA
                </span>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-home-muted-text max-w-xs">
              {t("footer.desc")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/jadara.dz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-home-soft-purple hover:bg-home-brand transition-all text-home-brand hover:text-home-surface hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61569257160690"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-home-soft-purple hover:bg-home-brand transition-all text-home-brand hover:text-home-surface hover:-translate-y-0.5"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@jadara.dz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-home-soft-purple hover:bg-home-brand transition-all text-home-brand hover:text-home-surface hover:-translate-y-0.5"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:ps-12">
            <p className="text-base font-bold text-home-main-text font-display mb-6 tracking-wide">
              {t("footer.links")}
            </p>
            <div className="flex flex-col gap-3 text-sm text-home-muted-text">
              <Link
                to="/"
                className="hover:text-home-brand transition-all hover:-translate-y-0.5 inline-block w-fit py-0.5"
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/about"
                className="hover:text-home-brand transition-all hover:-translate-y-0.5 inline-block w-fit py-0.5"
              >
                {t("nav.about")}
              </Link>
              <Link
                to="/faq"
                className="hover:text-home-brand transition-all hover:-translate-y-0.5 inline-block w-fit py-0.5"
              >
                {t("nav.faq")}
              </Link>
            </div>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <p className="text-base font-bold text-home-main-text font-display mb-6 tracking-wide">
              {t("contact.infoT")}
            </p>
            <div className="space-y-5 text-sm text-home-muted-text">
              <div>
                <a
                  href="mailto:jadara.dz.2026@gmail.com"
                  className="hover:text-home-brand transition-colors font-medium"
                >
                  jadara.dz.2026@gmail.com
                </a>
              </div>
              <div>
                <p>{t("footer.addressVal")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mx-auto max-w-6xl px-6 mt-16 pt-8 border-t border-home-border flex flex-col md:flex-row justify-center items-center">
          <p className="text-xs text-home-muted-text">
            © {new Date().getFullYear()} JADARA. {t("footer.rights")}
          </p>
        </div>
      </footer>

      {/* Floating Scroll to Top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 end-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-home-brand text-home-surface shadow-md border-none transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:bg-home-brand/90 ${
          showScroll
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-75 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
