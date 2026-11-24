import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"
import { ArrowLeftIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
  backTo?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  backTo,
  backLabel,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation("common")
  const { staggerItem } = useMotionVariants()

  return (
    <motion.header
      variants={staggerItem}
      className={cn("flex flex-col gap-3.5", className)}
    >
      {backTo ? (
        <Link
          to={backTo}
          className="group inline-flex w-fit items-center gap-1.5 rounded-md text-small-1 font-medium text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeftIcon
            className="size-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          {backLabel ?? t("actions.back")}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-title-2 font-semibold break-words text-secondary">
              {title}
            </h1>
            {meta}
          </div>
          {description ? (
            <p className="max-w-2xl text-small-1 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </motion.header>
  )
}
