import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
  label?: string;
}

export function VerifiedBadge({
  className,
  size = "md",
  withLabel = false,
  label = "موثق",
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-success", className)}
      title="موثق من جدارة"
    >
      <BadgeCheck className={cn(sizeClasses[size], "shrink-0")} />
      {withLabel && <span className="text-xs font-semibold">{label}</span>}
    </span>
  );
}
