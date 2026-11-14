import { cn } from "cn"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/util/initials"

interface IdentityCellProps {
  name: string
  secondary?: string | null
  imageUrl?: string | null
  className?: string
}

export function IdentityCell({ name, secondary, imageUrl, className }: IdentityCellProps) {
  const words = name.split(/\s+/)

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar size="lg">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback className="bg-accent text-small-2 font-semibold text-accent-foreground">
          {getInitials(words[0], words[1])}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{name}</span>
        {secondary ? (
          <span className="truncate text-small-2 text-muted-foreground">{secondary}</span>
        ) : null}
      </div>
    </div>
  )
}
