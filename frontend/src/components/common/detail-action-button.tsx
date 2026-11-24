import type { ComponentProps } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

export const DETAIL_ACTION_TONE_CLASS = {
  default: "",
  primary:
    "border-primary/40 bg-primary/10 text-primary hover:border-primary/60 hover:bg-primary/15 hover:text-primary",
  success:
    "border-success/40 bg-success-muted/30 text-success hover:border-success/60 hover:bg-success-muted hover:text-success dark:border-success/40 dark:bg-success-muted/20 dark:hover:bg-success-muted/40",
  warning:
    "border-warning/60 bg-warning-muted/40 text-warning-foreground hover:border-warning hover:bg-warning-muted hover:text-warning-foreground dark:border-warning/50 dark:bg-warning-muted/20 dark:text-warning dark:hover:bg-warning-muted/40",
  destructive:
    "border-destructive/40 bg-destructive-muted/20 text-destructive hover:border-destructive/60 hover:bg-destructive-muted hover:text-destructive dark:border-destructive/40 dark:bg-destructive-muted/20 dark:hover:bg-destructive-muted/40",
} as const

export type DetailActionTone = keyof typeof DETAIL_ACTION_TONE_CLASS

interface DetailActionButtonProps extends ComponentProps<typeof Button> {
  tone?: DetailActionTone
}

export function DetailActionButton({
  tone = "default",
  className,
  variant = "outline",
  type = "button",
  ...props
}: DetailActionButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      className={cn(
        "max-sm:h-9 max-sm:px-3 max-sm:text-small-2",
        DETAIL_ACTION_TONE_CLASS[tone],
        className
      )}
      {...props}
    />
  )
}
