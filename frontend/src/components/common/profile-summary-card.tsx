import type { ReactNode } from "react"
import { cn } from "cn"
import { motion } from "framer-motion"

import { DetailList, type DetailListItem } from "@/components/common/detail-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

const AVATAR_SIZE = {
  md: {
    frame: "size-[72px] rounded-[18px] after:rounded-[18px]",
    image: "rounded-[18px]",
    fallback: "rounded-[18px] text-[22px]",
    skeleton: "size-[72px] rounded-[18px]",
  },
  xl: {
    frame: "size-48 rounded-[22px] after:rounded-[22px]",
    image: "rounded-[22px]",
    fallback: "rounded-[22px] text-title-2",
    skeleton: "size-48 rounded-[22px]",
  },
} as const

interface ProfileSummaryCardProps {
  title: string
  subtitle?: string | null
  initials: string
  imageUrl?: string | null
  avatarSize?: keyof typeof AVATAR_SIZE
  badges?: ReactNode
  details?: DetailListItem[]
  footer?: ReactNode
  isLoading?: boolean
  className?: string
}

function ProfileSummarySkeleton({ avatarSize }: { avatarSize: keyof typeof AVATAR_SIZE }) {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true">
      <Skeleton className={AVATAR_SIZE[avatarSize].skeleton} />
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
  avatarSize = "md",
  badges,
  details,
  footer,
  isLoading = false,
  className,
}: ProfileSummaryCardProps) {
  const { staggerItem } = useMotionVariants()
  const avatar = AVATAR_SIZE[avatarSize]

  return (
    <motion.aside variants={staggerItem} className={cn("flex flex-col", className)}>
      {isLoading ? (
        <ProfileSummarySkeleton avatarSize={avatarSize} />
      ) : (
        <div className="flex flex-col">
          <Avatar className={avatar.frame}>
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt="" className={cn("object-cover", avatar.image)} />
            ) : null}
            <AvatarFallback
              className={cn(
                "bg-accent font-semibold text-accent-foreground",
                avatar.fallback
              )}
            >
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
