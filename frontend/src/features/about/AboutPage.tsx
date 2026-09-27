import { BookOpen, Eye, Target, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

export function AboutPage() {
  const { t } = useTranslation();

  const sections = [
    { icon: BookOpen, title: t("about.storyT"), text: t("about.story") },
    { icon: Target, title: t("about.whyTitle"), text: t("about.why") },
    { icon: Eye, title: t("about.visionT"), text: t("about.vision") },
    { icon: Users, title: t("about.communityTitle"), text: t("about.community") },
  ];

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-foreground font-display">
            {t("about.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">"{t("brand.tagline")}"</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border bg-card p-8 shadow-soft card-hover hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary mb-5 animate-pulse-subtle">
                  <s.icon className="h-6 w-6" />
                </span>
                <h2 className="text-xl font-bold text-foreground font-display mb-3">{s.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            asChild
            size="lg"
            className="font-bold px-8 shadow-md hover:shadow-lg transition-all"
          >
            <Link to="/">{t("about.discoverPlatform")}</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
