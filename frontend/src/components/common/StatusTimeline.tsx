import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineStatus = "completed" | "active" | "pending" | "rejected";

interface TimelineStep {
  label: string;
  sublabel?: string;
  status: TimelineStatus;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

const STEP_ICON = {
  completed: CheckCircle2,
  active: Clock,
  pending: Circle,
  rejected: XCircle,
} as const;

const STEP_COLORS = {
  completed: "text-success",
  active: "text-warning-foreground",
  pending: "text-muted-foreground",
  rejected: "text-destructive",
} as const;

const CONNECTOR_COLORS = {
  completed: "bg-success",
  active: "bg-warning",
  pending: "bg-border",
  rejected: "bg-destructive",
} as const;

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((step, i) => {
        const Icon = STEP_ICON[step.status];
        const isLast = i === steps.length - 1;

        return (
          <li key={i} className="relative flex gap-4">
            {/* Vertical connector */}
            {!isLast && (
              <div
                className={cn(
                  "absolute start-[11px] top-8 w-0.5 h-[calc(100%-8px)]",
                  CONNECTOR_COLORS[step.status],
                )}
              />
            )}
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              <Icon className={cn("h-6 w-6", STEP_COLORS[step.status])} />
            </div>
            {/* Text */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  step.status === "pending" && "text-muted-foreground",
                  step.status === "active" && "text-warning-foreground",
                  step.status === "completed" && "text-success",
                  step.status === "rejected" && "text-destructive",
                )}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
