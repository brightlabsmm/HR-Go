import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"
import { FileQuestionIcon, SearchXIcon } from "lucide-react"

import { EmptyStateIcon } from "@/assets/icons/empty-state-icon"
import { EmptyState } from "@/components/common/empty-state"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface PageEmptyStateProps {
  variant?: "empty" | "no-results" | "not-found"
  title: string
  description: string
  action?: ReactNode
  className?: string
}

function StateIcon({ variant }: { variant: "no-results" | "not-found" }) {
  const Icon = variant === "not-found" ? FileQuestionIcon : SearchXIcon

  return (
    <span className="relative flex size-20 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-accent" aria-hidden />
      <span
        className="absolute inset-2.5 rounded-full bg-primary/10"
        aria-hidden
      />
      <Icon className="relative size-8 text-primary" aria-hidden />
    </span>
  )
}

export function PageEmptyState({
  variant = "empty",
  title,
  description,
  action,
  className,
}: PageEmptyStateProps) {
  const { scaleIn } = useMotionVariants()
  const illustration =
    variant === "empty" ? (
      <EmptyStateIcon className="h-44 w-44 max-w-full" />
    ) : (
      <StateIcon variant={variant} />
    )

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <EmptyState
        illustration={illustration}
        title={title}
        description={description}
        className={variant === "empty" ? undefined : "[&>h2]:mt-6 [&>h2]:text-subtitle-2"}
      >
        {action}
      </EmptyState>
    </motion.div>
  )
}
