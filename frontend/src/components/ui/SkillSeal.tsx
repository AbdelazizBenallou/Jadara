import { BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Tamper-proof verified Skill Badge seal — used in CV builder & profiles. */
export function SkillSeal({ name, className }: { name: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/8 px-3 py-2 shadow-soft",
        className,
      )}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground">
        <BadgeCheck className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">{name}</p>
        <p className="text-xs text-success">{t("cv.verifiedBy")}</p>
      </div>
    </div>
  );
}
