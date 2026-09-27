import { Globe, Lock, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type Visibility = "public" | "private" | "hidden";

const OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "public", label: "مرئي للجميع", icon: Globe },
  { value: "private", label: "مرئي للشركاء فقط", icon: Lock },
  { value: "hidden", label: "مخفي", icon: EyeOff },
];

interface VisibilityControlProps {
  value: Visibility;
  onChange: (v: Visibility) => void;
  className?: string;
  compact?: boolean;
}

export function VisibilityControl({
  value,
  onChange,
  className,
  compact = false,
}: VisibilityControlProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/50",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
