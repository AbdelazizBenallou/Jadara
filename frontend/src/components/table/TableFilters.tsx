import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

export function TableFilters({
  search,
  onSearch,
  searchPlaceholder,
  selects = [],
}: {
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  selects?: {
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    placeholder: string;
  }[];
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {onSearch && (
        <div className="relative min-w-52 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder ?? t("common.search")}
            className="ps-9"
          />
        </div>
      )}
      {selects.map((s, i) => (
        <Select key={i} value={s.value} onValueChange={s.onChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={s.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {s.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
