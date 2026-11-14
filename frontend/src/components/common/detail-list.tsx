import type { ReactNode } from "react"
import { cn } from "cn"

export interface DetailListItem {
  label: string
  value: ReactNode
  mono?: boolean
}

interface DetailListProps {
  items: DetailListItem[]
  columns?: 1 | 2
  className?: string
}

export function DetailList({ items, columns = 1, className }: DetailListProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-8 gap-y-6",
        columns === 2 && "sm:grid-cols-2",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-1">
          <dt className="text-small-2 font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd
            className={cn(
              "min-w-0 text-body-2 wrap-break-word text-foreground",
              item.mono && "font-mono text-small-1"
            )}
          >
            {item.value === null || item.value === undefined || item.value === ""
              ? "—"
              : item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
