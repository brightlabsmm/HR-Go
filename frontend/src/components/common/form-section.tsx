import type { ReactNode } from "react"
import { cn } from "cn"

import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"

export const formStackClassName =
  "flex flex-col [&>[data-slot=field-set]:first-of-type]:border-t-0 [&>[data-slot=field-set]:first-of-type]:pt-2 mb-4"

interface FormSectionProps {
  legend: string
  description?: string
  tone?: "default" | "danger"
  className?: string
  children: ReactNode
}

export function FormSection({
  legend,
  description,
  tone = "default",
  className,
  children,
}: FormSectionProps) {
  const isDanger = tone === "danger"

  return (
    <FieldSet
      className={cn(
        "grid gap-6 border-t border-hair py-8 md:grid-cols-[17.5rem_minmax(0,1fr)] md:gap-12",
        className
      )}
    >
      <div className="min-w-0">
        <FieldLegend
          className={cn(
            "mb-0 text-body-2 font-semibold",
            isDanger ? "text-destructive" : "text-foreground"
          )}
        >
          {legend}
        </FieldLegend>
        {description ? (
          <FieldDescription className="mt-1">{description}</FieldDescription>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </FieldSet>
  )
}
