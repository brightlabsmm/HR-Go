import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface SectionCardProps {
  title?: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
  footer?: ReactNode
  tone?: "default" | "danger"
  className?: string
  contentClassName?: string
  children?: ReactNode
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  footer,
  tone = "default",
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  const { staggerItem } = useMotionVariants()
  const isDanger = tone === "danger"
  const hasHeader = Boolean(title || description || actions)
  const isHeaderOnly = hasHeader && !children && !footer

  return (
    <motion.section
      variants={staggerItem}
      className={cn(
        "flex flex-col border-t border-hair pt-2",
        isDanger && "border-destructive/30",
        className
      )}
    >
      {hasHeader ? (
        <header
          className={cn(
            "flex flex-wrap justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6",
            isHeaderOnly ? "items-center pb-5 md:pb-6" : "items-start"
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  isDanger
                    ? "bg-destructive-muted text-destructive"
                    : "bg-accent text-primary"
                )}
                aria-hidden
              >
                <Icon className="size-4.5" />
              </span>
            ) : null}
            <div className="flex min-w-0 flex-col gap-0.5">
              {title ? (
                <h2
                  className={cn(
                    "text-body-1 font-semibold",
                    isDanger ? "text-destructive" : "text-foreground"
                  )}
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="text-small-1 text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      {children ? (
        <div className={cn("py-6", contentClassName)}>
          {children}
        </div>
      ) : null}
      {footer ? (
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-hair pt-4">
          {footer}
        </footer>
      ) : null}
    </motion.section>
  )
}
