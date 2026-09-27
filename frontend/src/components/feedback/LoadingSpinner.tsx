import { useTranslation } from "react-i18next";

export function LoadingSpinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted-foreground">{label ?? t("common.loading")}</p>
    </div>
  );
}
