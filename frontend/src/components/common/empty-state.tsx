import { cn } from "cn"

import type { ReactNode } from "react"

interface EmptyStateProps {
  illustration: ReactNode
  title: string
  description: string
  className?: string
  children?: ReactNode
}

export function EmptyState({
  illustration,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10 text-center",
        className
      )}
    >
      {illustration}
      <h2 className="mt-8 text-title-2 font-semibold text-secondary">{title}</h2>
      <p className="mt-2 max-w-lg text-small-1 text-muted-foreground">
        {description}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
