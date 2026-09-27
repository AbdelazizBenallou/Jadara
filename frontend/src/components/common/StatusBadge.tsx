import {
  CheckCircle2,
  Clock,
  XCircle,
  Info,
  CircleDashed,
  BadgeCheck,
  Ban,
  FileUp,
  GraduationCap,
  FileEdit,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { StatusType } from "@/constants/statusTypes";

/**
 * StatusBadge — single component driven by the status token table (§8).
 * Every status pill in the app must use this component, never a one-off <span>.
 *
 * Icons map 1:1 to status tokens per §7:
 *   CheckCircle2 = success, Clock = pending, XCircle = error, Info = info
 */

type StatusCategory = "success" | "warning" | "error" | "info" | "neutral";

const categoryMap: Record<string, StatusCategory> = {
  // §8 status table
  verified: "success",
  approved: "success",
  active: "success",
  completed: "success",
  under_review: "warning",
  pending: "warning",
  rejected: "error",
  disabled: "neutral",
  draft: "neutral",
  uploaded: "neutral",
  learning: "info",
  changes_requested: "warning",
};

const categoryStyles: Record<StatusCategory, string> = {
  success: "bg-success-bg text-success border-success/20",
  warning: "bg-warning-bg text-warning border-warning/20",
  error: "bg-destructive-bg text-destructive border-destructive/20",
  info: "bg-info-bg text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

const categoryIcons: Record<StatusCategory, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: Clock,
  error: XCircle,
  info: Info,
  neutral: CircleDashed,
};

/** Override icons for specific statuses that need a more specific icon */
const statusIconOverrides: Partial<Record<string, React.ComponentType<{ className?: string }>>> = {
  verified: BadgeCheck,
  disabled: Ban,
  uploaded: FileUp,
  learning: GraduationCap,
  draft: FileEdit,
  changes_requested: FileEdit,
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusType | string;
  className?: string;
}) {
  const { t } = useTranslation();
  const category = categoryMap[status] ?? "neutral";
  const Icon = statusIconOverrides[status] ?? categoryIcons[category];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        categoryStyles[category],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {t(`status.${status}`)}
    </span>
  );
}
