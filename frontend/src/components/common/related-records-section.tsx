import type { ReactNode } from "react"
import { Link } from "react-router"

export interface RelatedRecordColumn<T> {
  key: string
  header: string
  className?: string
  render: (item: T) => ReactNode
}

interface RelatedRecordsSectionProps<T> {
  title: string
  description?: string
  count?: number
  isLoading?: boolean
  emptyText: string
  items: T[]
  getRowKey: (item: T) => string
  columns: RelatedRecordColumn<T>[]
  viewAllTo?: string
  viewAllLabel?: string
}

/**
 * Shared structural section for listing linked records (departments, positions, shifts, employees)
 * on detail pages without duplicating table markup.
 */
export function RelatedRecordsSection<T>({
  title,
  description,
  count,
  isLoading,
  emptyText,
  items,
  getRowKey,
  columns,
  viewAllTo,
  viewAllLabel,
}: RelatedRecordsSectionProps<T>) {
  return (
    <section className="border-t border-hair pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-body-2 font-semibold text-foreground">{title}</h2>
            {typeof count === "number" && (
              <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-small-2 text-muted-foreground">{description}</p>
          )}
        </div>
        {viewAllTo && viewAllLabel && (
          <Link
            to={viewAllTo}
            className="text-small-2 font-medium text-primary hover:underline"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-md border border-hair bg-subtle/40" />
      ) : items.length === 0 ? (
        <p className="text-small-2 text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-hair">
          <table className="w-full text-small-2">
            <thead className="border-b border-hair bg-subtle text-left font-medium text-muted-foreground">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={`p-3 ${col.className ?? ""}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {items.map((item) => (
                <tr key={getRowKey(item)} className="hover:bg-subtle/40">
                  {columns.map((col) => (
                    <td key={col.key} className={`p-3 ${col.className ?? ""}`}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
