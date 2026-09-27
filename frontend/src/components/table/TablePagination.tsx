import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function TablePagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-t px-4 py-2.5">
      <p className="text-xs text-muted-foreground">
        {t("common.page")} {page} {t("common.of")} {pages}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
