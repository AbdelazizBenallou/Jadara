import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, CheckCircle2, Quote } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useLanguage } from "@/context/LanguageContext";
import { ContactSection } from "@/features/home/ContactSection";
import { MembersSection } from "@/features/home/MembersSection";
import { landingCopy } from "@/features/home/landingCopy";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`material-icons-round leading-none ${className}`}
    >
      {name}
    </span>
  );
}

const galleryImages = [
  {
    src: "/images/landing/members_team.jpg",
    span: "md:col-span-7 md:row-span-2",
    aspect: "aspect-[4/3] md:aspect-auto",
  },
  {
    src: "/images/landing/feature.jpg",
    span: "md:col-span-5",
    aspect: "aspect-[16/10]",
  },
  {
    src: "/images/landing/about_manifest.jpg",
    span: "md:col-span-5",
    aspect: "aspect-[16/10]",
  },
  {
    src: "/images/landing/hero_section.jpg",
    span: "md:col-span-12",
    aspect: "aspect-[21/7]",
  },
];

export function HomePage() {
  const { t } = useTranslation();
  const { language, direction } = useLanguage();
  const copy = landingCopy[language];
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setQuoteIndex(
          (current) => (current + 1) % copy.testimonials.items.length,
        ),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [copy.testimonials.items.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".landing-page > section"),
    ).slice(1);

    sections.forEach((section) => section.classList.add("landing-reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const activeQuote = copy.testimonials.items[quoteIndex];
  const activeInitials = activeQuote.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <PublicLayout>
      <div className="landing-page">
        <section className="relative w-full overflow-hidden bg-white px-5 pb-20 pt-28 md:px-10 lg:px-16 lg:pb-28 lg:pt-32">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col items-start gap-5 lg:col-span-7">
              <div className="landing-enter inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4d1b65]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b00d4]">
                  {copy.hero.eyebrow}
                </span>
              </div>

              <h1
                className="landing-enter landing-display max-w-4xl text-[42px] font-semibold uppercase leading-[1.04] tracking-[-0.035em] text-[#1e1a26] sm:text-[54px] lg:text-[66px]"
                style={{ animationDelay: "70ms" }}
              >
                {copy.hero.title}{" "}
                <span className="font-serif italic normal-case text-[#4d1b65]">
                  {copy.hero.titleAccent}
                </span>
              </h1>

              <p
                className="landing-enter max-w-xl text-lg leading-7 text-[#484456]"
                style={{ animationDelay: "140ms" }}
              >
                {copy.hero.description}
              </p>

              <div
                className="landing-enter flex w-full flex-wrap items-center gap-5 pt-2 sm:w-auto"
                style={{ animationDelay: "210ms" }}
              >
                <Link
                  to="/register"
                  className="jd-btn group inline-flex items-center justify-center gap-2 bg-[#4d1b65] px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-[#3b144f]"
                >
                  {copy.hero.join}
                  <Icon
                    name="arrow_forward"
                    className="text-sm transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  />
                </Link>
                <a
                  className="inline-flex items-center gap-2 border-b border-[#1e1a26]/30 py-4 text-sm font-semibold text-[#1e1a26] transition-colors hover:border-[#4d1b65] hover:text-[#4d1b65]"
                  href="#members"
                >
                  {copy.hero.explore}
                  <Icon name="south" className="text-sm" />
                </a>
              </div>

              <div
                className="landing-enter flex items-center gap-4 pt-6"
                style={{ animationDelay: "280ms" }}
              >
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    alt=""
                    className="inline-block h-9 w-9 rounded-full object-cover ring-2 ring-white"
                    src="/images/landing/feature.jpg"
                  />
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e6deff] text-[11px] font-bold text-[#4d1b65] ring-2 ring-white">
                    MK
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e7deff] text-[11px] font-bold text-[#6446c8] ring-2 ring-white">
                    RA
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8dff1] text-[10px] font-bold tracking-tight text-[#484456] ring-2 ring-white">
                    +500
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#1e1a26]">
                    {copy.hero.members}
                  </span>
                  <span className="text-[13px] leading-5 text-[#484456]">
                    {copy.hero.cities}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="landing-enter relative mt-8 lg:col-span-5 lg:mt-0"
              style={{ animationDelay: "160ms" }}
            >
              <div className="jd-photo relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#f4eafc]">
                <img
                  className="landing-img-hero h-full w-full object-cover"
                  src="/images/landing/hero_section.jpg"
                  width="1600"
                  height="1200"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  alt={copy.hero.eyebrow}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1a26]/65 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3 text-white">
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e6deff]">
                      {copy.hero.salon}
                    </span>
                    <p className="landing-display text-xl font-medium">
                      {copy.hero.archive}
                    </p>
                  </div>
                  <span className="rounded bg-[#1e1a26]/40 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e6deff] backdrop-blur-sm">
                    {copy.hero.archiveYear}
                  </span>
                </div>
              </div>

              <div className="landing-float absolute -top-4 -left-4 hidden items-center gap-2 rounded bg-white p-2 shadow-md sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6446c8]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1e1a26]">
                  {copy.hero.established}
                </span>
              </div>
              <div className="landing-float landing-float--slow absolute -bottom-6 -right-2 hidden max-w-[210px] rounded bg-white p-4 shadow-md sm:block">
                <p className="text-xs font-semibold leading-snug text-[#1e1a26]">
                  {copy.hero.quote}
                </p>
                <span className="mt-1 block text-[13px] leading-5 text-[#484456]">
                  {copy.hero.source}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="landing-section w-full bg-[#f9f1ff] px-5 py-20 md:px-10 lg:px-16 lg:py-28"
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <span className="landing-eyebrow mb-4">
                  {copy.about.eyebrow}
                </span>
                <h2 className="landing-display mb-5 max-w-lg text-4xl font-semibold uppercase leading-[1.06] tracking-[-0.03em] text-[#1e1a26] sm:text-5xl">
                  {copy.about.title}
                </h2>
                <p className="mb-4 text-lg leading-7 text-[#484456]">
                  {copy.about.body1}
                </p>
                <p className="mb-8 text-[15px] leading-6 text-[#484456]">
                  {copy.about.body2}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded bg-white p-4 pt-6">
                <div>
                  <span className="landing-display block text-4xl font-bold leading-none text-[#4d1b65]">
                    {copy.about.statRatio}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[#484456]">
                    {copy.about.statRatioLabel}
                  </span>
                </div>
                <div>
                  <span className="landing-display block text-4xl font-bold leading-none text-[#6446c8]">
                    {copy.about.statHubs}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[#484456]">
                    {copy.about.statHubsLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-6">
              <div className="jd-photo relative h-[440px] w-full overflow-hidden rounded bg-[#f4eafc]">
                <img
                  className="landing-img-drift h-full w-full object-cover"
                  src="/images/landing/about_manifest.jpg"
                  width="1280"
                  height="852"
                  loading="lazy"
                  decoding="async"
                  alt={copy.about.title}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded bg-white p-4">
                <div className="flex items-center gap-3">
                  <Icon
                    name="auto_stories"
                    className="text-xl text-[#4d1b65]"
                  />
                  <span className="text-sm font-semibold text-[#1e1a26]">
                    {copy.about.manifesto}
                  </span>
                </div>
                <Link
                  to="/about"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4d1b65] hover:underline"
                >
                  {copy.about.read} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="values"
          className="landing-section w-full bg-white px-5 py-20 md:px-10 lg:px-16 lg:py-28"
        >
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="landing-eyebrow mb-2">
                {copy.values.eyebrow}
              </span>
              <h2 className="landing-display text-4xl font-semibold uppercase tracking-[-0.03em] text-[#1e1a26] sm:text-5xl">
                {copy.values.title}
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-6 text-[#484456]">
              {copy.values.lead}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {copy.values.items.map((item) => (
              <div
                key={item.title}
                className="landing-card group flex min-h-[320px] flex-col justify-between rounded bg-[#f4eafc] p-6 shadow-sm transition-all duration-300 hover:bg-[#eee5f7]"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4d1b65]">
                      {item.kicker}
                    </span>
                    <Icon
                      name={item.icon}
                      className="text-2xl text-[#6446c8] transition-transform group-hover:scale-110"
                    />
                  </div>
                  <h3 className="landing-display mb-3 text-xl font-semibold uppercase tracking-tight text-[#1e1a26] transition-colors group-hover:text-[#4d1b65]">
                    {item.title}
                  </h3>
                  <p className="text-[15px] leading-6 text-[#484456]">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 pt-6">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#484456]">
                    {item.meta}
                  </span>
                  <Icon
                    name="east"
                    className="text-sm text-[#484456] transition-all group-hover:translate-x-1 group-hover:text-[#4d1b65] rtl:rotate-180"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="global-team"
          className="landing-section w-full bg-[#e8dff1] px-5 py-20 md:px-10 lg:px-16 lg:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="landing-eyebrow mb-2">
                  {copy.team.eyebrow}
                </span>
                <h2 className="landing-display max-w-xl text-4xl font-semibold uppercase tracking-[-0.03em] text-[#1e1a26] sm:text-5xl">
                  {copy.team.title}
                </h2>
              </div>
              <p className="max-w-md text-[15px] leading-6 text-[#484456]">
                {copy.team.lead}
              </p>
            </div>

            <div className="mx-auto max-w-5xl">
              <div className="jd-photo relative aspect-[16/9] w-full overflow-hidden rounded bg-[#f4eafc]">
                <img
                  className="landing-img-pan h-full w-full object-cover"
                  src="/images/landing/members_team.jpg"
                  width="1280"
                  height="960"
                  alt={copy.team.caption}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1a26]/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white">
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e6deff]">
                      {copy.team.caption}
                    </span>
                    <p className="landing-display text-xl font-medium">
                      {copy.team.captionNote}
                    </p>
                  </div>
                  <span className="rounded bg-[#1e1a26]/40 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e6deff] backdrop-blur-sm">
                    {copy.team.year}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MembersSection copy={copy.members} />

        <section
          id="story"
          className="landing-section relative w-full overflow-hidden bg-[#332e3b] px-5 py-20 text-[#f6edff] md:px-10 lg:px-16 lg:py-36"
        >
          <div className="absolute inset-0 z-0">
            <div
              className="landing-bg-zoom h-full w-full bg-cover bg-center opacity-20 grayscale contrast-125"
              style={{
                backgroundImage: "url('/images/landing/about_manifest.jpg')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#332e3b] via-[#332e3b]/90 to-[#332e3b]/70" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e6deff]">
              {copy.story.eyebrow}
            </span>
            <h2 className="landing-display mb-5 text-4xl font-semibold uppercase leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              {copy.story.title}
            </h2>
            <p className="mb-8 max-w-3xl text-lg leading-7 text-[#f6edff]/80">
              {copy.story.body}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                to="/about"
                className="jd-btn jd-btn--on-dark inline-flex items-center gap-2 bg-[#4d1b65] px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#3b144f]"
              >
                {copy.story.cta}
                <Icon name="menu_book" className="text-sm" />
              </Link>
              <div className="flex items-center gap-2 text-[#e6deff]">
                <Icon name="verified" className="text-lg" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {copy.story.badge}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="gallery"
          className="landing-section w-full bg-white px-5 py-20 md:px-10 lg:px-16 lg:py-28"
        >
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="landing-eyebrow mb-2">
                {copy.gallery.eyebrow}
              </span>
              <h2 className="landing-display text-4xl font-semibold uppercase tracking-[-0.03em] text-[#1e1a26] sm:text-5xl">
                {copy.gallery.title}
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-6 text-[#484456]">
              {copy.gallery.lead}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {galleryImages.map((image, index) => {
              const item = copy.gallery.items[index];
              const isPanorama = index === 3;
              return (
                <div
                  key={item.title}
                  className={`landing-gallery-card jd-photo group relative cursor-pointer overflow-hidden rounded-lg ${image.span} ${image.aspect} ${isPanorama ? "mt-1" : ""}`}
                >
                  <img
                    className="landing-gallery-motion h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={image.src}
                    alt={item.caption}
                    loading="lazy"
                    decoding="async"
                    style={{ animationDelay: `${index * -2.4}s` }}
                  />
                  <div
                    className={`absolute inset-0 flex items-end bg-gradient-to-t from-[#1e1a26]/75 via-transparent to-transparent p-6 text-white ${
                      isPanorama
                        ? ""
                        : "opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    }`}
                  >
                    <div className="landing-gallery-caption flex w-full items-end justify-between gap-3">
                      <div>
                        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e6deff]">
                          {item.time}
                        </span>
                        <p className="landing-display text-lg font-medium">
                          {item.caption}
                        </p>
                      </div>
                      <Icon
                        name="zoom_in"
                        className="landing-zoom-icon text-2xl"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="voices"
          className="landing-section w-full bg-[#faf8fc] px-5 py-20 md:px-10 lg:px-16 lg:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <span className="text-sm font-semibold text-[#4d1b65]">
                  {copy.testimonials.kicker}
                </span>
                <h2 className="landing-display mt-3 max-w-md text-4xl font-semibold leading-tight text-[#1e1a26] sm:text-5xl">
                  {copy.testimonials.eyebrow}
                </h2>
                <p className="mt-5 max-w-md text-[15px] leading-7 text-[#484456]">
                  {copy.testimonials.lead}
                </p>

                <div className="mt-8 space-y-2">
                  {copy.testimonials.items.map((quote, index) => {
                    const isActive = index === quoteIndex;

                    return (
                      <button
                        key={quote.name}
                        type="button"
                        onClick={() => setQuoteIndex(index)}
                        aria-pressed={isActive}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
                          isActive
                            ? "border-[#4d1b65]/25 bg-white"
                            : "border-transparent hover:bg-white/70"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            isActive ? "bg-[#4d1b65]" : "bg-[#cac3d9]"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              isActive ? "text-[#1e1a26]" : "text-[#484456]"
                            }`}
                          >
                            {quote.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#484456]/75">
                            {quote.role}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    aria-label="Previous quote"
                    className="landing-testimonial-arrow flex h-11 w-11 items-center justify-center rounded-full border border-[#ddd8e5] bg-white text-[#1e1a26] shadow-sm transition-colors hover:border-[#4d1b65]/30 hover:text-[#4d1b65]"
                    type="button"
                    onClick={() =>
                      setQuoteIndex(
                        (current) =>
                          (current - 1 + copy.testimonials.items.length) %
                          copy.testimonials.items.length,
                      )
                    }
                  >
                    <Icon name="west" className="text-sm rtl:rotate-180" />
                  </button>
                  <span className="text-sm text-[#484456]">
                    <span className="font-semibold text-[#4d1b65]">
                      {quoteIndex + 1}
                    </span>
                    <span className="mx-1 text-[#484456]/40">/</span>
                    {copy.testimonials.items.length}
                  </span>
                  <button
                    aria-label="Next quote"
                    className="landing-testimonial-arrow flex h-11 w-11 items-center justify-center rounded-full border border-[#ddd8e5] bg-white text-[#1e1a26] shadow-sm transition-colors hover:border-[#4d1b65]/30 hover:text-[#4d1b65]"
                    type="button"
                    onClick={() =>
                      setQuoteIndex(
                        (current) =>
                          (current + 1) % copy.testimonials.items.length,
                      )
                    }
                  >
                    <Icon name="east" className="text-sm rtl:rotate-180" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <figure
                  key={`${language}-${quoteIndex}`}
                  className="landing-enter rounded-2xl border border-[#e7e3eb] bg-white p-7 sm:p-9"
                >
                  <div>
                    <Quote className="h-7 w-7 text-[#4d1b65]" />

                    <blockquote
                      aria-live="polite"
                      className="landing-display mt-5 max-w-2xl text-2xl font-medium leading-[1.45] tracking-[-0.015em] text-[#1e1a26] sm:text-[30px]"
                    >
                      “{activeQuote.quote}”
                    </blockquote>

                    <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-[#e7e3eb] pt-6">
                      <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#4d1b65] text-sm font-bold text-white">
                          {activeInitials}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#1e1a26]">
                            {activeQuote.name}
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-[#484456]">
                            {activeQuote.role}
                          </div>
                        </div>
                      </div>
                    </figcaption>
                  </div>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section w-full bg-white px-5 py-20 md:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-5xl rounded-xl bg-[#f9f1ff] p-6 shadow-sm md:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="flex flex-col gap-4 lg:col-span-8">
                <span className="landing-eyebrow">{copy.join.eyebrow}</span>
                <h2 className="landing-display text-4xl font-semibold uppercase tracking-[-0.03em] text-[#1e1a26] sm:text-5xl">
                  {copy.join.title}
                </h2>
                <p className="max-w-xl text-lg leading-7 text-[#484456]">
                  {copy.join.body}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[13px] leading-5 text-[#484456]">
                  <CheckCircle2 className="h-4 w-4 text-[#4d1b65]" />
                  <span>{copy.join.note}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end">
                <Link
                  to="/register"
                  className="jd-btn inline-flex w-full items-center justify-center gap-2 bg-[#4d1b65] px-6 py-4 text-center text-sm font-semibold text-white transition-colors hover:bg-[#3b144f] sm:w-auto"
                >
                  {copy.join.cta} <Arrow className="h-4 w-4" />
                </Link>
                <span className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#484456] lg:text-right">
                  {copy.join.cohort}
                </span>
              </div>
            </div>
          </div>
        </section>

        <ContactSection copy={copy.contact} />
        <div className="sr-only">{t("brand.tagline")}</div>
      </div>
    </PublicLayout>
  );
}
