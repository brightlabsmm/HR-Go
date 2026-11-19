import { useId } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

export interface PageTabItem {
  to: string
  label: string
  icon?: LucideIcon
  end?: boolean
}

interface PageTabsProps {
  items: PageTabItem[]
  label: string
  className?: string
}

export function PageTabs({ items, label, className }: PageTabsProps) {
  const layoutId = useId()
  const { staggerItem } = useMotionVariants()

  return (
    <motion.nav
      variants={staggerItem}
      aria-label={label}
      className={cn("flex gap-1 overflow-x-auto border-b", className)}
    >
      {items.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative flex shrink-0 items-center gap-2 px-3 pt-1 pb-3 text-small-1 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {Icon ? <Icon className="size-4" aria-hidden /> : null}
                {item.label}
                {isActive ? (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    aria-hidden
                  />
                ) : null}
              </>
            )}
          </NavLink>
        )
      })}
    </motion.nav>
  )
}
