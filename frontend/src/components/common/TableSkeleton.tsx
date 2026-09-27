import { Skeleton } from "@/components/ui/skeleton";

/**
 * TableSkeleton — skeleton rows for tables, not spinners (§9 Loading State).
 * Renders `rows` skeleton rows with `columns` shimmer blocks each.
 */
export function TableSkeleton({ columns = 4, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-start">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {Array.from({ length: columns }).map((_, ci) => (
                  <td key={ci} className="px-4 py-3">
                    <Skeleton
                      className="h-4"
                      style={{
                        width: `${ci === 0 ? 60 : 30 + Math.random() * 40}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
