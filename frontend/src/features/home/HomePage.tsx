import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ShieldCheck, Award, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-6 transition-all duration-500 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <PublicLayout>
      {/* ═══ 1. HERO ═══ */}
      <section className="relative text-center overflow-hidden bg-[#F4F0F9]">
        {/* Soft atmospheric base gradient — noticeably lavender, not white */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(150deg, #F2EEF8 0%, #EDE8F5 40%, #EDE9F3 70%, #EAE6F2 100%)",
          }}
        />

        {/* Deep background organic blob - Top Right (lavender-purple) */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[70%] max-w-[800px] h-[600px] pointer-events-none blur-[90px] lg:blur-[140px] rounded-[100%]"
          style={{
            background: "radial-gradient(circle, rgba(145, 110, 180, 0.30) 0%, rgba(91, 36, 122, 0.08) 70%, transparent 100%)",
            transform: "rotate(-15deg)",
          }}
        />

        {/* Deep background organic blob - Bottom Left (dusty pink-lilac) */}
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[65%] max-w-[750px] h-[650px] pointer-events-none blur-[90px] lg:blur-[140px] rounded-[100%]"
          style={{
            background: "radial-gradient(circle, rgba(196, 140, 185, 0.25) 0%, rgba(145, 110, 180, 0.08) 70%, transparent 100%)",
            transform: "rotate(20deg)",
          }}
        />

        {/* Mid-layer accent blob - Top Left (soft purple) */}
        <div
          className="absolute top-[5%] left-[-5%] w-[45%] max-w-[550px] h-[450px] pointer-events-none blur-[70px] lg:blur-[110px] rounded-[100%]"
          style={{
            background: "radial-gradient(circle, rgba(91, 36, 122, 0.16) 0%, transparent 75%)",
          }}
        />

        {/* Mid-layer accent blob - Bottom Right (blue-lavender) */}
        <div
          className="absolute bottom-[0%] right-[-5%] w-[50%] max-w-[600px] h-[500px] pointer-events-none blur-[70px] lg:blur-[110px] rounded-[100%]"
          style={{
            background: "radial-gradient(circle, rgba(100, 90, 190, 0.14) 0%, transparent 75%)",
          }}
        />

        {/* Center soft tint — keeps headline readable without washing out the lavender */}
        <div
          className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[80%] max-w-[800px] h-[550px] pointer-events-none blur-[70px] rounded-[100%]"
          style={{
            background: "radial-gradient(ellipse, rgba(248, 245, 255, 0.55) 0%, rgba(240, 235, 252, 0.20) 55%, transparent 80%)",
          }}
        />

        {/* Flowing Curved Line Accents */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          viewBox="0 0 1440 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "hidden" }}
        >
          {/* Top Left Curves */}
          <path
            d="M-100 150 C 200 100, 400 300, 600 -50"
            stroke="url(#gradient-curve-1)"
            strokeWidth="2"
            strokeDasharray="8 6"
            opacity="0.55"
          />
          <path
            d="M-50 260 C 150 210, 450 410, 710 -50"
            stroke="url(#gradient-curve-1)"
            strokeWidth="1.2"
            opacity="0.35"
          />
          {/* Bottom Right Curves — new organic geometry, confined to edges */}
          <path
            d="M 1180 850 C 1250 680, 1360 700, 1480 580"
            stroke="url(#gradient-curve-2)"
            strokeWidth="1.8"
            strokeDasharray="8 6"
            opacity="0.45"
          />
          <path
            d="M 1280 850 C 1330 720, 1420 750, 1520 620"
            stroke="url(#gradient-curve-2)"
            strokeWidth="1.2"
            opacity="0.30"
          />
          <path
            d="M 1350 850 C 1380 780, 1460 780, 1500 700"
            stroke="url(#gradient-curve-2)"
            strokeWidth="0.8"
            opacity="0.25"
          />

          <defs>
            <linearGradient id="gradient-curve-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5B247A" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#C98A94" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-curve-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4B63AA" stopOpacity="0" />
              <stop offset="100%" stopColor="#5B247A" stopOpacity="0.60" />
            </linearGradient>
          </defs>
        </svg>

        {/* Fine grid texture — clearly perceptible, fades toward edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(91, 36, 122, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(91, 36, 122, 0.02) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 0%, black 40%, transparent 100%)",
          }}
        />
        <RevealSection>
          <div className="relative mx-auto max-w-4xl px-4 pt-32 pb-16 lg:pt-40 lg:pb-24 flex flex-col items-center justify-center z-10">
            {/* Badge */}
            <div className="mb-8 text-sm font-bold text-home-brand font-display tracking-wider">
              {t("home.hero.badge")}
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-7xl max-w-4xl text-home-primary-dark font-display">
              {t("home.hero.titlePre")}
              <span className="text-home-brand">{t("home.hero.titleHighlight")}</span>
              {t("home.hero.titlePost")}
            </h1>

            {/* Subtitle */}
            <p className="mt-8 max-w-2xl text-lg text-home-muted-text sm:text-xl leading-relaxed">
              {t("home.hero.subtitle")}
            </p>

            {/* CTAs */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="font-bold px-8 h-14 text-base rounded-xl shadow-sm hover:shadow-md transition-all bg-home-brand text-home-surface hover:bg-home-brand/90 hover:-translate-y-0.5 border-none"
              >
                <Link to="/register">
                  {t("home.hero.cta1")} <Arrow className="ms-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-bold px-8 h-14 text-base rounded-xl bg-home-surface border-home-border text-home-brand hover:bg-home-page-bg hover:text-home-brand transition-all hover:-translate-y-0.5"
              >
                <a href="#how">{t("home.hero.cta2")}</a>
              </Button>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ═══ 2. BENEFITS ═══ */}
      <section className="py-24 lg:py-32 bg-[#F5F2F7]">
        <div className="mx-auto max-w-6xl px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-24">
              <h2 className="text-3xl font-extrabold text-home-primary-dark font-display lg:text-5xl leading-tight">
                {t("home.benefits.title")}
              </h2>
            </div>
          </RevealSection>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Benefit 1 */}
            <RevealSection className="delay-100">
              <div className="flex flex-col p-8 lg:p-10 bg-home-surface rounded-[20px] border border-home-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out group h-full">
                <div className="h-14 w-14 rounded-[14px] bg-home-soft-purple text-home-brand flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 ease-out">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-home-main-text">
                  {t("home.benefits.b1Title")}
                </h3>
                <p className="text-home-muted-text leading-relaxed text-sm lg:text-base">
                  {t("home.benefits.b1Desc")}
                </p>
              </div>
            </RevealSection>

            {/* Benefit 2 */}
            <RevealSection className="delay-200">
              <div className="flex flex-col p-8 lg:p-10 bg-home-surface rounded-[20px] border border-home-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out group h-full">
                <div className="h-14 w-14 rounded-[14px] bg-home-soft-purple text-home-brand flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 ease-out">
                  <Award className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-home-main-text">
                  {t("home.benefits.b2Title")}
                </h3>
                <p className="text-home-muted-text leading-relaxed text-sm lg:text-base">
                  {t("home.benefits.b2Desc")}
                </p>
              </div>
            </RevealSection>

            {/* Benefit 3 */}
            <RevealSection className="delay-300">
              <div className="flex flex-col p-8 lg:p-10 bg-home-surface rounded-[20px] border border-home-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out group h-full">
                <div className="h-14 w-14 rounded-[14px] bg-home-soft-purple text-home-brand flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 ease-out">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-home-main-text">
                  {t("home.benefits.b3Title")}
                </h3>
                <p className="text-home-muted-text leading-relaxed text-sm lg:text-base">
                  {t("home.benefits.b3Desc")}
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══ 3. HOW JADARA WORKS ═══ */}
      <section id="how" className="scroll-mt-24 py-24 lg:py-32 bg-home-surface">
        <div className="mx-auto max-w-6xl px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-28">
              <h2 className="text-3xl font-extrabold text-home-primary-dark font-display lg:text-5xl leading-tight mb-4">
                {t("home.how.title")}
              </h2>
            </div>
          </RevealSection>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting lines */}
            <RevealSection className="absolute inset-0 z-0 pointer-events-none">
              {/* Desktop connecting horizontal line */}
              <div className="absolute top-10 start-[12.5%] end-[12.5%] hidden h-[2px] bg-[#D8CBE0] md:block" />

              {/* Mobile connecting vertical line */}
              <div className="absolute top-[2.5rem] bottom-[2.5rem] start-[2.5rem] block w-[2px] bg-[#D8CBE0] md:hidden" />
            </RevealSection>

            <div className="flex flex-col md:grid md:grid-cols-4 gap-12 relative z-10">
              {[1, 2, 3, 4].map((num, i) => {
                const delays = ["delay-75", "delay-150", "delay-200", "delay-300"];
                return (
                  <RevealSection key={num} className={delays[i]}>
                    <div
                      className="flex flex-row md:flex-col items-center md:text-center gap-6 md:gap-0 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-home-brand focus-visible:ring-offset-4 rounded-xl"
                      tabIndex={0}
                    >
                      <div
                        className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ease-out group-hover:bg-home-brand group-hover:text-home-surface group-hover:border-home-brand group-hover:scale-105 group-hover:shadow-md group-focus:bg-home-brand group-focus:text-home-surface group-focus:border-home-brand group-focus:scale-105 group-focus:shadow-md md:mb-8 font-display text-3xl font-light ${
                          num === 1
                            ? "bg-home-brand text-home-surface border-home-brand shadow-md"
                            : "bg-home-surface text-home-primary-dark border-[#BFA8CC] shadow-sm"
                        }`}
                      >
                        0{num}
                      </div>
                      <h3 className="font-bold text-xl text-home-main-text font-display group-hover:text-home-primary-dark transition-colors">
                        {t(`home.how.s${num}`)}
                      </h3>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. PATHS ═══ */}
      <section className="py-24 lg:py-32 bg-[#FCFAFD]">
        <div className="mx-auto max-w-6xl px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-24">
              <h2 className="text-3xl font-extrabold text-home-primary-dark font-display lg:text-5xl leading-tight mb-4">
                {t("home.paths.title")}
              </h2>
              <p className="text-lg text-home-muted-text">{t("home.paths.subtitle")}</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Path 1: Available Now */}
              <div className="bg-home-surface rounded-[20px] p-8 lg:p-10 border border-home-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-home-soft-purple text-home-brand text-sm font-bold mb-6">
                    {t("home.paths.path1Badge")}
                  </span>
                  <h3 className="text-3xl font-extrabold font-display text-home-main-text mb-4">
                    {t("home.paths.path1Title")}
                  </h3>
                  <p className="text-lg text-home-muted-text leading-relaxed mb-6 max-w-md">
                    {t("home.paths.path1Desc")}
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="w-fit font-bold rounded-xl px-8 mt-auto pt-2 pb-2 bg-home-brand text-home-surface hover:bg-home-brand/90 border-none hover:-translate-y-0.5 transition-all"
                >
                  <Link to="/register">{t("home.paths.path1Cta")}</Link>
                </Button>
              </div>

              {/* Path 2: Future / Coming Soon */}
              <div className="bg-home-page-bg rounded-[20px] p-8 lg:p-10 border border-home-border relative overflow-hidden flex flex-col h-full">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-home-surface border border-home-border text-home-muted-text text-sm font-bold mb-6">
                    {t("home.paths.path2Badge")}
                  </span>
                  <h3 className="text-3xl font-extrabold font-display text-home-muted-text mb-4">
                    {t("home.paths.path2Title")}
                  </h3>
                  <p className="text-lg text-home-muted-text leading-relaxed mb-6 max-w-md">
                    {t("home.paths.path2Desc")}
                  </p>
                </div>
                <div className="w-fit px-6 py-2.5 mt-auto rounded-full border border-home-border bg-home-surface text-sm font-bold text-home-muted-text">
                  {t("home.paths.path2Soon")}
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══ 5. FINAL CTA ═══ */}
      <section className="py-12 lg:py-20 px-4 lg:px-8 bg-home-page-bg">
        <div
          className="mx-auto max-w-5xl text-center relative overflow-hidden rounded-[32px] py-16 lg:py-20 shadow-[0_12px_32px_rgba(91,36,122,0.10)]"
          style={{
            background: "linear-gradient(135deg, #421659 0%, #682E8A 50%, #AC8CBF 100%)",
          }}
        >
          <div className="mx-auto max-w-3xl px-6 relative z-10">
            <RevealSection>
              <h2 className="text-3xl font-extrabold text-white font-display lg:text-4xl leading-tight mb-4">
                {t("home.cta.titlePre")}
                <span className="text-[#F2EEF8]">{t("home.cta.titleHighlight")}</span>
                {t("home.cta.titlePost")}
              </h2>
              <p className="text-lg lg:text-xl text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto font-light">
                {t("home.cta.subtitle")}
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="font-bold px-10 h-14 text-lg rounded-xl shadow-sm hover:shadow transition-colors duration-200 bg-white text-[#5B247A] hover:bg-gray-50 border-none"
              >
                <Link to="/register">{t("home.cta.btn")}</Link>
              </Button>
            </RevealSection>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
