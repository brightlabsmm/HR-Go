import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"

import { DetailList, type DetailListItem } from "@/components/common/detail-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

interface ProfileSummaryCardProps {
  title: string
  subtitle?: string | null
  initials: string
  imageUrl?: string | null
  badges?: ReactNode
  details?: DetailListItem[]
  footer?: ReactNode
  isLoading?: boolean
  className?: string
}

function ProfileSummarySkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true">
      <Skeleton className="size-[72px] rounded-[18px]" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}

export function ProfileSummaryCard({
  title,
  subtitle,
  initials,
  imageUrl,
  badges,
  details,
  footer,
  isLoading = false,
  className,
}: ProfileSummaryCardProps) {
  const { staggerItem } = useMotionVariants()

  return (
    <motion.aside variants={staggerItem} className={cn("flex flex-col", className)}>
      {isLoading ? (
        <ProfileSummarySkeleton />
      ) : (
        <div className="flex flex-col">
          <Avatar className="size-[72px] rounded-[18px] after:rounded-[18px]">
            {imageUrl ? <AvatarImage src={imageUrl} alt="" className="rounded-[18px]" /> : null}
            <AvatarFallback className="rounded-[18px] bg-accent text-[22px] font-semibold text-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-subtitle-2 font-semibold break-words text-secondary">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-small-1 break-words text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {badges ? <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div> : null}
          </div>
          {details && details.length > 0 ? (
            <DetailList items={details} className="mt-6 border-t border-hair pt-5" />
          ) : null}
          {footer ? <div className="mt-6 border-t border-hair pt-5">{footer}</div> : null}
        </div>
      )}
    </motion.aside>
  )
}
