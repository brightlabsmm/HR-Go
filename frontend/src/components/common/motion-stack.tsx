import type { ReactNode } from "react"
import { motion } from "framer-motion"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface MotionStackProps {
  className?: string
  children: ReactNode
}

export function MotionStack({ className, children }: MotionStackProps) {
  const { staggerContainer } = useMotionVariants()

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}
