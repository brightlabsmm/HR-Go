import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface ListCardProps {
  toolbar?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function ListCard({ toolbar, footer, className, children }: ListCardProps) {
  const { staggerItem } = useMotionVariants()

  return (
    <motion.div
      variants={staggerItem}
      className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}
    >
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {children}
      </div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </motion.div>
  )
}
