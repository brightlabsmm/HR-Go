import type { ComponentProps } from "react"
import { cn } from "cn"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none dark:bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
