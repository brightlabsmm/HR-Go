import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface FormActionsProps {
  className?: string
  children: ReactNode
}

export function FormActions({ className, children }: FormActionsProps) {
  const { staggerItem } = useMotionVariants()

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex flex-wrap items-center justify-end gap-3 border-t border-hair pt-6",
        className
      )}
    >
      {children}
    </motion.div>
  )
}
