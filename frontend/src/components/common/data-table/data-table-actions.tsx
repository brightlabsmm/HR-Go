import type { ReactNode } from "react"
import { cn } from "cn"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  extraItems?: ReactNode
  viewLabel?: string
  editLabel?: string
  deleteLabel?: string
}

export function DataTableActions({
  onView,
  onEdit,
  onDelete,
  extraItems,
  viewLabel,
  editLabel,
  deleteLabel,
}: DataTableActionsProps) {
  const { t } = useTranslation("common")
  const hasPrimary = Boolean(onView || onEdit)
  const hasExtra = extraItems != null
  const hasDelete = Boolean(onDelete)

  if (!hasPrimary && !hasExtra && !hasDelete) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("table.row_actions")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "cursor-pointer text-muted-foreground"
        )}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {hasPrimary ? (
          <DropdownMenuGroup>
            {onView ? (
              <DropdownMenuItem className="cursor-pointer" onClick={onView}>
                <EyeIcon />
                {viewLabel ?? t("actions.view")}
              </DropdownMenuItem>
            ) : null}
            {onEdit ? (
              <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
                <PencilIcon />
                {editLabel ?? t("actions.edit")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        ) : null}
        {hasPrimary && hasExtra ? <DropdownMenuSeparator /> : null}
        {hasExtra ? <DropdownMenuGroup>{extraItems}</DropdownMenuGroup> : null}
        {hasDelete ? (
          <>
            {hasPrimary || hasExtra ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={onDelete}
              >
                <Trash2Icon />
                {deleteLabel ?? t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type { DataTableActionsProps }
