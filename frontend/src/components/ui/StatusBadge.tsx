import {
  BadgeCheck,
  Clock3,
  XCircle,
  FileUp,
  CircleDashed,
  CheckCircle2,
  Ban,
  GraduationCap,
  FileEdit,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { StatusType } from "@/constants/statusTypes";

const styles: Record<string, string> = {
  verified: "bg-success-bg text-success border-success/20",
  approved: "bg-success-bg text-success border-success/20",
  active: "bg-success-bg text-success border-success/20",
  published: "bg-success-bg text-success border-success/20",
  completed: "bg-success-bg text-success border-success/20",
  under_review: "bg-warning-bg text-warning border-warning/20",
  pending: "bg-warning-bg text-warning border-warning/20",
  learning: "bg-info-bg text-info border-info/20",

  disabled: "bg-destructive-bg text-destructive border-destructive/20",
  uploaded: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  changes_requested: "bg-warning-bg text-warning border-warning/20",
};

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  verified: BadgeCheck,
  approved: CheckCircle2,
  active: CheckCircle2,
  published: CheckCircle2,
  completed: CheckCircle2,
  under_review: Clock3,
  pending: CircleDashed,
  learning: GraduationCap,

  disabled: Ban,
  uploaded: FileUp,
  draft: FileEdit,
  changes_requested: Clock3,
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusType | string;
  className?: string;
}) {
  const { t } = useTranslation();
  const Icon = icons[status] ?? CircleDashed;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {t(`status.${status}`)}
    </span>
  );
}
