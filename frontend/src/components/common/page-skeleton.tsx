import { TableSkeleton } from "@/components/common/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6" role="status" aria-busy="true">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-button" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-input w-80 max-w-full rounded-input" />
        <Skeleton className="hidden h-input w-44 rounded-input sm:block" />
      </div>
      <TableSkeleton />
    </div>
  )
}
