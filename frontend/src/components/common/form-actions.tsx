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
        "flex flex-col gap-3 border-t border-hair pt-6 sm:flex-row sm:flex-wrap sm:items-center",
        start ? "sm:justify-between" : "sm:justify-end",
        className
      )}
    >
      {start ? <div className="w-full sm:w-auto">{start}</div> : null}
      <div className="flex w-full flex-col-reverse gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {children}
      </div>
    </motion.div>
  )
}
