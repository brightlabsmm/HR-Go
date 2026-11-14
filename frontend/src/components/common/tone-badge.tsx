import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const toneBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-small-2 font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        success: "bg-success-muted text-success",
        warning: "bg-warning-muted text-foreground",
        destructive: "bg-destructive-muted text-destructive",
        info: "bg-info-muted text-info",
        neutral: "bg-muted text-muted-foreground",
        brand: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

const dotVariants = cva("size-1.5 shrink-0 rounded-full", {
  variants: {
    tone: {
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      info: "bg-info",
      neutral: "bg-muted-foreground",
      brand: "bg-primary",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
})

export type BadgeTone = NonNullable<VariantProps<typeof toneBadgeVariants>["tone"]>

interface ToneBadgeProps {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: ReactNode
}

export function ToneBadge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: ToneBadgeProps) {
  return (
    <span className={cn(toneBadgeVariants({ tone }), className)}>
      {dot ? <span className={dotVariants({ tone })} aria-hidden /> : null}
      {children}
    </span>
  )
}
