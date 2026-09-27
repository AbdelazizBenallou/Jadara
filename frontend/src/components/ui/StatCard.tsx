import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft",
        className,
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
