import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="font-semibold">{title ?? t("empty.title")}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description ?? t("empty.desc")}</p>
    </div>
  );
}
