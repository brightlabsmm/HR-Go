import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface FormActionsProps {
  className?: string
  start?: ReactNode
  children: ReactNode
}

export function FormActions({ className, start, children }: FormActionsProps) {
  const { staggerItem } = useMotionVariants()

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-hair pt-6",
        start ? "justify-between" : "justify-end",
        className
      )}
    >
      {start}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        {children}
      </div>
    </motion.div>
  )
}
