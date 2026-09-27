import { type ReactNode, useState } from "react";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { TablePagination } from "./TablePagination";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  loading,
  pageSize = 6,
  emptyTitle,
  emptyDesc,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDesc?: string;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = rows.slice((page - 1) * pageSize, page * pageSize);

  /* §9 Loading State: skeleton rows for tables, not spinners */
  if (loading) return <TableSkeleton columns={columns.length} rows={pageSize} />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDesc} />;

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-start">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-start font-semibold text-muted-foreground ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 transition-colors hover:bg-muted/40"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && <TablePagination page={page} pages={pages} onChange={setPage} />}
    </div>
  );
}
