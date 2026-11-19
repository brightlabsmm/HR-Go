import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface MotionCollapseProps {
  show: boolean
  children: ReactNode
}

export function MotionCollapse({ show, children }: MotionCollapseProps) {
  const { collapse } = useMotionVariants()

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          className="overflow-hidden"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={collapse}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
