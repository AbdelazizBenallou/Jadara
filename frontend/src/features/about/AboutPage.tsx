import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

type MemberFilter = "all" | "technology" | "data" | "design" | "business";

const categories = [
  { id: "technology", label: "filterTechnology", icon: "memory" },
  { id: "data", label: "filterData", icon: "analytics" },
  { id: "design", label: "filterDesign", icon: "draw" },
  { id: "business", label: "filterBusiness", icon: "business_center" },
] as const;

const memberFields = [
  { id: "web", icon: "code", category: "technology" },
  { id: "data", icon: "psychology", category: "data" },
  { id: "design", icon: "palette", category: "design" },
  { id: "marketing", icon: "campaign", category: "business" },
] as const satisfies ReadonlyArray<{
  id: string;
  icon: string;
  category: Exclude<MemberFilter, "all">;
}>;

const filters = [{ id: "all", label: "filterAll" }, ...categories] as const;

const stats = [
  { value: "04", label: "statFields" },
  { value: "03", label: "statLanguages" },
  { value: "01", label: "statStandard" },
  { value: "2026", label: "statEdition" },
] as const;

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

export function AboutPage() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<MemberFilter>("all");

  const titleWords = t("about.title").trim().split(/\s+/);
  const titleAccent = titleWords[titleWords.length - 1] ?? "";
  const titleLead = titleWords.slice(0, -1).join(" ");

  const values = [
    {
      icon: "lightbulb",
      title: t("about.whyTitle"),
      text: t("about.why"),
    },
    {
      icon: "visibility",
      title: t("about.visionT"),
      text: t("about.vision"),
    },
    {
      icon: "groups",
      title: t("about.communityTitle"),
      text: t("about.community"),
    },
  ];

  const visibleFields =
    activeFilter === "all"
      ? memberFields
      : memberFields.filter((field) => field.category === activeFilter);

  return (
    <PublicLayout>
      <div className="landing-page bg-white">
        <section className="bg-white px-5 pb-16 pt-2 md:px-10 lg:px-16 lg:pb-24 lg:pt-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="landing-display mx-auto max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.035em] text-[#1e1a26] sm:text-6xl">
              {titleLead} <span className="text-[#4d1b65]">{titleAccent}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#484456] sm:text-xl">
              {t("brand.tagline")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="jd-btn inline-flex items-center justify-center gap-2 bg-[#4d1b65] px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#3b144f]"
              >
                {t("about.members.join")}
                <Icon name="arrow_forward" className="text-sm rtl:rotate-180" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 border-b border-[#1e1a26]/20 py-4 text-sm font-semibold text-[#1e1a26] transition-colors hover:border-[#4d1b65] hover:text-[#4d1b65]"
              >
                {t("about.discoverPlatform")}
                <Icon name="north_east" className="text-sm rtl:rotate-180" />
              </Link>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-y-8 border-t border-[#e7e3eb] pt-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <span className="landing-display block text-3xl font-bold leading-none text-[#4d1b65]">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-[#484456]">
                    {t(`about.members.${stat.label}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="story"
          className="landing-section border-y border-[#ece8f0] bg-[#faf8fc] px-5 py-20 md:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <span className="text-sm font-semibold text-[#4d1b65]">
                {t("about.storyT")}
              </span>
              <h2 className="landing-display mt-3 text-3xl font-semibold leading-tight text-[#1e1a26] sm:text-4xl">
                {t("about.whyTitle")}
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#484456] sm:text-xl sm:leading-9">
                {t("about.story")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-2xl border border-[#e7e3eb] bg-white p-6 transition-colors hover:border-[#4d1b65]/20"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4eafc] text-[#4d1b65]">
                    <Icon name={value.icon} className="text-xl" />
                  </span>
                  <h3 className="landing-display mt-5 text-xl font-semibold text-[#1e1a26]">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#484456]">
                    {value.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="members"
          className="landing-section bg-white px-5 py-20 md:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <span className="text-sm font-semibold text-[#4d1b65]">
                {t("about.members.eyebrow")}
              </span>
              <h2 className="landing-display mt-3 text-3xl font-semibold leading-tight text-[#1e1a26] sm:text-4xl">
                {t("about.members.titleLine1")}{" "}
                <span className="text-[#4d1b65]">
                  {t("about.members.titleLine2")}
                </span>
              </h2>
              <p className="mt-4 text-base leading-7 text-[#484456]">
                {t("about.members.lead")}
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div
                role="group"
                aria-label={t("about.members.filterLabel")}
                className="flex flex-wrap gap-2"
              >
                {filters.map((filter) => {
                  const isActive = activeFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-[#4d1b65] bg-[#4d1b65] text-white"
                          : "border-[#e7e3eb] bg-white text-[#484456] hover:border-[#4d1b65]/30 hover:text-[#4d1b65]"
                      }`}
                    >
                      {t(`about.members.${filter.label}`)}
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-[#484456]">
                {visibleFields.length} {t("about.members.countLabel")}
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleFields.map((field) => (
                <article
                  key={field.id}
                  className="flex flex-col rounded-2xl border border-[#e7e3eb] bg-white p-6 transition-colors hover:border-[#4d1b65]/20"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4eafc] text-[#4d1b65]">
                    <Icon name={field.icon} className="text-xl" />
                  </span>
                  <h3 className="landing-display mt-5 text-lg font-semibold leading-snug text-[#1e1a26]">
                    {t(`about.members.fields.${field.id}.title`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#484456]">
                    {t(`about.members.fields.${field.id}.desc`)}
                  </p>
                  <p className="mt-5 border-t border-[#ece8f0] pt-4 text-xs leading-5 text-[#4d1b65]">
                    {t(`about.members.fields.${field.id}.skills`)}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-[#ece8f0] pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-7 text-[#484456]">
                {t("about.members.joinNote")}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#4d1b65] transition-colors hover:text-[#3b144f] sm:self-auto"
              >
                {t("about.members.join")}
                <Icon name="arrow_forward" className="text-sm rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[#ece8f0] bg-[#faf8fc] px-5 py-20 md:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="landing-display text-3xl font-semibold leading-tight text-[#1e1a26] sm:text-4xl">
              {t("home.cta.titlePre")}{" "}
              <span className="text-[#4d1b65]">
                {t("home.cta.titleHighlight")}
              </span>{" "}
              {t("home.cta.titlePost")}
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#484456]">
              {t("home.cta.subtitle")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="jd-btn inline-flex items-center justify-center gap-2 bg-[#4d1b65] px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#3b144f]"
              >
                {t("home.cta.btn")}
                <Icon name="arrow_forward" className="text-sm rtl:rotate-180" />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-lg border border-[#d9d2e3] bg-white px-7 py-4 text-sm font-semibold text-[#1e1a26] transition-colors hover:border-[#4d1b65]/40 hover:text-[#4d1b65]"
              >
                {t("about.discoverPlatform")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
