import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * EmptyState — icon (24px, muted color) + one-line message + optional
 * primary action button (§9).
 *
 * Voice: "No skills added yet", not "Oops, nothing here!" (§9).
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  onAction,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="font-semibold">{title ?? t("empty.title")}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description ?? t("empty.desc")}</p>
      {action && onAction && (
        <Button onClick={onAction} className="mt-2">
          {action}
        </Button>
      )}
    </div>
  );
}
