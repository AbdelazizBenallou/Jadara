import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * KpiCard / StatCard — simple number + label + optional trend icon.
 * Used consistently across all dashboard overview pages (§9).
 */

export type TrendDirection = "up" | "down" | "flat";

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: TrendDirection;
  trendLabel?: string;
  className?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div
      className={cn("flex items-center gap-4 rounded-lg border bg-card p-5 shadow-soft", className)}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        {trend && (
          <span
            className={cn("mt-0.5 inline-flex items-center gap-1 text-xs font-medium", trendColor)}
          >
            <TrendIcon className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
