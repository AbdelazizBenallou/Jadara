import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqGroups = [
  {
    id: "gettingStarted",
    icon: "rocket_launch",
    keys: ["q1", "q2"],
  },
  {
    id: "evidence",
    icon: "fact_check",
    keys: ["q3", "q5", "q6"],
  },
  {
    id: "verification",
    icon: "verified",
    keys: ["q4", "q7"],
  },
  {
    id: "account",
    icon: "shield",
    keys: ["q8", "q9"],
  },
] as const;

type FaqGroupId = (typeof faqGroups)[number]["id"] | "all";

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

export function FaqPage() {
  const { t } = useTranslation();
  const [activeGroup, setActiveGroup] = useState<FaqGroupId>("all");
  const [query, setQuery] = useState("");

  const faqKeys = faqGroups.flatMap((group) => group.keys);
  const search = query.trim().toLowerCase();

  const filteredGroups = faqGroups
    .map((group) => ({
      ...group,
      items: group.keys.filter((key) => {
        if (activeGroup !== "all" && activeGroup !== group.id) return false;
        if (!search) return true;

        const question = t(`faq.${key}`);
        const answer = t(`faq.${key.replace("q", "a")}`);
        return `${question} ${answer}`.toLowerCase().includes(search);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const resultCount = filteredGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const renderAnswerText = (text: string) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [, linkText, linkUrl] = match;
        if (linkUrl.startsWith("/")) {
          return (
            <Link
              key={index}
              to={linkUrl}
              className="font-semibold text-[#4d1b65] hover:underline"
            >
              {linkText}
            </Link>
          );
        }

        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#4d1b65] hover:underline"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <PublicLayout>
      <div className="landing-page">
        <section className="bg-white px-5 pb-14 pt-2 md:px-10 lg:px-16 lg:pb-16 lg:pt-4">
          <div className="landing-enter mx-auto max-w-3xl text-center">
            <h1 className="landing-display text-4xl font-semibold leading-tight text-[#1e1a26] sm:text-5xl">
              {t("faq.title")}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#484456] sm:text-lg sm:leading-8">
              {t("faq.subtitle")}
            </p>
          </div>
        </section>

        <section
          id="questions"
          className="border-t border-[#ece8f0] bg-[#faf8fc] px-5 py-16 md:px-10 lg:px-16 lg:py-20"
        >
          <div className="relative mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              <aside className="lg:col-span-4">
                <div className="space-y-4 lg:sticky lg:top-28">
                  <div className="rounded-2xl border border-[#e7e3eb] bg-white p-5 sm:p-6">
                    <h2 className="landing-display text-xl font-semibold text-[#1e1a26]">
                      {t("faq.topics")}
                    </h2>

                    <div className="mt-4 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveGroup("all")}
                        aria-pressed={activeGroup === "all"}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-start text-sm font-semibold transition-colors ${
                          activeGroup === "all"
                            ? "bg-[#4d1b65] text-white"
                            : "text-[#484456] hover:bg-[#f9f1ff] hover:text-[#4d1b65]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <Icon name="apps" className="text-lg" />
                          {t("faq.all")}
                        </span>
                        <span className="text-xs opacity-60">
                          {faqKeys.length}
                        </span>
                      </button>

                      {faqGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setActiveGroup(group.id)}
                          aria-pressed={activeGroup === group.id}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-start text-sm font-semibold transition-colors ${
                            activeGroup === group.id
                              ? "bg-[#4d1b65] text-white"
                              : "text-[#484456] hover:bg-[#f9f1ff] hover:text-[#4d1b65]"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Icon name={group.icon} className="text-lg" />
                            {t(`faq.categories.${group.id}`)}
                          </span>
                          <span className="text-xs opacity-60">
                            {group.keys.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="hidden rounded-2xl bg-[#4d1b65] p-6 text-white lg:block">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                      <Icon name="support_agent" className="text-xl" />
                    </span>
                    <h3 className="landing-display mt-5 text-xl font-semibold">
                      {t("faq.helpTitle")}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {t("faq.helpText")}
                    </p>
                    <a
                      href="mailto:jadara.dz.2026@gmail.com"
                      className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
                    >
                      {t("faq.contactCta")}
                      <Icon
                        name="arrow_forward"
                        className="text-sm transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      />
                    </a>
                  </div>
                </div>
              </aside>

              <div className="lg:col-span-8">
                <div className="rounded-2xl border border-[#e7e3eb] bg-white p-4 sm:p-5">
                  <div className="relative">
                    <Icon
                      name="search"
                      className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-xl text-[#484456]/55"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("faq.searchPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#e7e3eb] bg-[#f9f1ff]/60 ps-11 pe-11 text-sm text-[#1e1a26] outline-none transition-colors placeholder:text-[#484456]/55 focus:border-[#4d1b65]/40 focus:bg-white"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label={t("faq.clearFilters")}
                        className="absolute end-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#484456] transition-colors hover:bg-[#f4eafc] hover:text-[#4d1b65]"
                      >
                        <Icon name="close" className="text-lg" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#484456]">
                    <span>
                      <span className="text-[#4d1b65]">{resultCount}</span>{" "}
                      {t("faq.results")}
                    </span>
                    {activeGroup !== "all" && (
                      <button
                        type="button"
                        onClick={() => setActiveGroup("all")}
                        className="text-[#4d1b65] hover:underline"
                      >
                        {t("faq.all")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {filteredGroups.map((group) => (
                    <section
                      key={group.id}
                      className="overflow-hidden rounded-2xl border border-[#e7e3eb] bg-white"
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-[#e7e3eb] bg-[#f9f1ff]/70 px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4eafc] text-[#4d1b65]">
                            <Icon name={group.icon} className="text-xl" />
                          </span>
                          <h2 className="landing-display text-lg font-semibold text-[#1e1a26]">
                            {t(`faq.categories.${group.id}`)}
                          </h2>
                        </div>
                        <span className="text-xs text-[#484456]/70">
                          {group.items.length}
                        </span>
                      </div>

                      <Accordion
                        type="single"
                        collapsible
                        className="px-5 sm:px-6"
                      >
                        {group.items.map((key) => (
                          <AccordionItem
                            key={key}
                            value={key}
                            className="border-b border-[#e7e3eb] py-1 last:border-0"
                          >
                            <AccordionTrigger className="gap-4 py-5 text-start text-[15px] font-semibold text-[#1e1a26] transition-colors hover:text-[#4d1b65] hover:no-underline [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[#4d1b65]">
                              {t(`faq.${key}`)}
                            </AccordionTrigger>
                            <AccordionContent className="pb-5 text-sm leading-7 text-[#484456]">
                              {renderAnswerText(
                                t(`faq.${key.replace("q", "a")}`),
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </section>
                  ))}

                  {filteredGroups.length === 0 && (
                    <div className="rounded-2xl border border-[#e7e3eb] bg-white px-6 py-14 text-center">
                      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4eafc] text-[#4d1b65]">
                        <Icon name="search_off" className="text-2xl" />
                      </span>
                      <h2 className="landing-display mt-5 text-2xl font-semibold text-[#1e1a26]">
                        {t("faq.emptyTitle")}
                      </h2>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#484456]">
                        {t("faq.emptyText")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setActiveGroup("all");
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4d1b65] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3b144f]"
                      >
                        {t("faq.clearFilters")}
                        <Icon name="refresh" className="text-base" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e7e3eb] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:hidden">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4eafc] text-[#4d1b65]">
                      <Icon name="mail" className="text-xl" />
                    </span>
                    <p className="text-sm font-medium text-[#484456]">
                      {t("faq.helpText")}
                    </p>
                  </div>
                  <a
                    href="mailto:jadara.dz.2026@gmail.com"
                    className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#4d1b65] hover:underline"
                  >
                    {t("faq.contactCta")}
                    <Icon
                      name="arrow_forward"
                      className="text-base rtl:rotate-180"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
