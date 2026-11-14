import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"

interface FormSkeletonProps {
  fields?: number
  columns?: 1 | 2
  className?: string
}

export function FormSkeleton({
  fields = 4,
  columns = 1,
  className,
}: FormSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("grid gap-5", columns === 2 && "md:grid-cols-2", className)}
    >
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-input w-full rounded-input" />
        </div>
      ))}
    </div>
  )
}
