import { isValidElement, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminStatVariant = "blue" | "green" | "yellow" | "red" | "purple";

interface AdminStatBoxProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }> | ReactNode;
  variant?: AdminStatVariant;
  moreInfoHref?: string;
  moreInfoText?: string;
  subtext?: string;
  className?: string;
}

const variantStyles: Record<
  AdminStatVariant,
  {
    bg: string;
    text: string;
    footerBg: string;
    footerHover: string;
    iconColor: string;
  }
> = {
  blue: {
    bg: "bg-[#0D6EFD]",
    text: "text-white",
    footerBg: "bg-black/15",
    footerHover: "hover:bg-black/25",
    iconColor: "text-white/20 group-hover:text-white/30",
  },
  green: {
    bg: "bg-[#28A745]",
    text: "text-white",
    footerBg: "bg-black/15",
    footerHover: "hover:bg-black/25",
    iconColor: "text-white/20 group-hover:text-white/30",
  },
  yellow: {
    bg: "bg-[#FFC107]",
    text: "text-[#212529]",
    footerBg: "bg-black/10",
    footerHover: "hover:bg-black/20",
    iconColor: "text-black/15 group-hover:text-black/25",
  },
  red: {
    bg: "bg-[#DC3545]",
    text: "text-white",
    footerBg: "bg-black/15",
    footerHover: "hover:bg-black/25",
    iconColor: "text-white/20 group-hover:text-white/30",
  },
  purple: {
    bg: "bg-[#7135E8]",
    text: "text-white",
    footerBg: "bg-black/15",
    footerHover: "hover:bg-black/25",
    iconColor: "text-white/20 group-hover:text-white/30",
  },
};

export function AdminStatBox({
  title,
  value,
  icon,
  variant = "blue",
  moreInfoHref,
  moreInfoText = "More info",
  subtext,
  className,
}: AdminStatBoxProps) {
  const styles = variantStyles[variant] || variantStyles.blue;

  const renderIcon = () => {
    if (isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const Comp = icon as ComponentType<{ className?: string }>;
      return <Comp className="h-20 w-20 stroke-[1.5]" />;
    }
    return null;
  };

  return (
    <div
      className={cn(
        "admin-stat-box group relative flex flex-col justify-between overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        styles.bg,
        styles.text,
        className,
      )}
    >
      {/* Top Content */}
      <div className="relative z-10 p-5">
        <div className="max-w-[70%]">
          <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {value}
          </div>
          <p className="mt-1 text-sm font-semibold opacity-90">{title}</p>
          {subtext && (
            <p className="mt-0.5 text-xs opacity-75">{subtext}</p>
          )}
        </div>

        {/* Large Decorative Icon on Right */}
        <div
          className={cn(
            "pointer-events-none absolute top-4 end-4 transition-transform duration-300 group-hover:scale-110",
            styles.iconColor,
          )}
        >
          {renderIcon()}
        </div>
      </div>

      {/* Footer "More info" Link */}
      {moreInfoHref ? (
        <Link
          to={moreInfoHref}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold tracking-wide transition-colors",
            styles.footerBg,
            styles.footerHover,
          )}
        >
          <span>{moreInfoText}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>
      ) : (
        <div
          className={cn("h-2 w-full", styles.footerBg)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
