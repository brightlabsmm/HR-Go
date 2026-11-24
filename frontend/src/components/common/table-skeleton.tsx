import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"

const CELL_WIDTHS = ["w-16", "w-36", "w-28", "w-24", "w-20", "w-32"]

interface TableSkeletonProps {
  columns?: number
  rows?: number
  className?: string
}

export function TableSkeleton({
  columns = 5,
  rows = 6,
  className,
}: TableSkeletonProps) {
  const columnKeys = Array.from({ length: columns }, (_, index) => index)
  const rowKeys = Array.from({ length: rows }, (_, index) => index)

  return (
    <div
      className={cn("w-full overflow-hidden bg-transparent", className)}
      role="status"
      aria-busy="true"
    >
      <div className="flex h-12 items-center gap-6 border-b border-border px-1 md:h-11">
        {columnKeys.map((column) => (
          <Skeleton
            key={column}
            className={cn(
              "h-3 bg-muted",
              column === columns - 1 ? "ml-auto w-12" : "w-20 flex-1"
            )}
          />
        ))}
      </div>
      {rowKeys.map((row) => (
        <div
          key={row}
          className="flex h-20 items-center gap-6 border-b px-4 last:border-b-0 md:h-16"
          style={{ opacity: 1 - row * 0.1 }}
        >
          {columnKeys.map((column) => (
            <div
              key={column}
              className={cn(
                "flex",
                column === columns - 1 ? "ml-auto w-12 justify-end" : "flex-1"
              )}
            >
              <Skeleton
                className={cn(
                  "h-3.5",
                  column === columns - 1
                    ? "size-7 rounded-md"
                    : CELL_WIDTHS[(row + column) % CELL_WIDTHS.length]
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
