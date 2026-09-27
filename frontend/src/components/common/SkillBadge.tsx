import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  name: string;
  verified?: boolean;
  level?: string;
  domains?: string[];
  size?: "sm" | "md";
  className?: string;
}

export function SkillBadge({
  name,
  verified = false,
  level,
  size = "md",
  className,
}: SkillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        verified
          ? "bg-success/10 text-success border border-success/20"
          : "bg-muted text-muted-foreground border border-border",
        className,
      )}
    >
      {verified && <BadgeCheck className="h-3 w-3 shrink-0" />}
      <span>{name}</span>
      {level && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0 text-[10px]",
            verified ? "bg-success/20" : "bg-background",
          )}
        >
          {level}
        </span>
      )}
    </span>
  );
}
