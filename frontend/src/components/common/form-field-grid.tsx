import type { ReactNode } from "react"
import { cn } from "cn"

interface FormFieldGridProps {
  className?: string
  children: ReactNode
}

export function FormFieldGrid({ className, children }: FormFieldGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 lg:grid-cols-2", className)}>
      {children}
    </div>
  )
}
