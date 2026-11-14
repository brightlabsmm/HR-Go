import { useId } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

export interface SegmentedControlOption {
  value: string
  label: string
  icon?: LucideIcon
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  label: string
  onValueChange: (value: string) => void
  className?: string
}

export function SegmentedControl({
  options,
  value,
  label,
  onValueChange,
  className,
}: SegmentedControlProps) {
  const layoutId = useId()

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex h-input shrink-0 items-center gap-1 rounded-input border bg-muted/60 p-1",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative flex h-full items-center gap-1.5 rounded-md px-3 text-small-1 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                aria-hidden
              />
            ) : null}
            {Icon ? <Icon className="relative size-4" aria-hidden /> : null}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
