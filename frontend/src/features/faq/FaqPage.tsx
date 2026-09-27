import { HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useLanguage } from "@/context/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqPage() {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"];

  const renderAnswerText = (text: string) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [, linkText, linkUrl] = match;
        if (linkUrl.startsWith("/")) {
          return (
            <Link key={index} to={linkUrl} className="text-primary font-semibold hover:underline">
              {linkText}
            </Link>
          );
        } else {
          return (
            <a
              key={index}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              {linkText}
            </a>
          );
        }
      }
      return part;
    });
  };

  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-foreground font-display">{t("faq.title")}</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("faq.subtitle")}</p>
        </div>

        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary animate-pulse-subtle">
            <HelpCircle className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold text-foreground font-display">{t("faq.title")}</h2>
        </div>

        <Accordion
          type="single"
          collapsible
          className="rounded-xl border bg-card px-6 py-2 shadow-soft"
        >
          {faqKeys.map((key) => (
            <AccordionItem key={key} value={key} className="last:border-0 py-1">
              <AccordionTrigger className="text-start font-semibold text-muted-foreground hover:text-primary transition-colors text-base py-4">
                {t(`faq.${key}`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                {renderAnswerText(t(`faq.${key.replace("q", "a")}`))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <a
            href="mailto:jadara.dz.2026@gmail.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {t("faq.notAnswered")} <Arrow className="ms-1 h-4 w-4" />
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
