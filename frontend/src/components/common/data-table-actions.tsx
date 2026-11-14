import { PencilIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface DataTableActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
}

export function DataTableActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: DataTableActionsProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={editLabel ?? t("actions.edit")}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-icon hover:bg-destructive-muted hover:text-destructive"
          aria-label={deleteLabel ?? t("actions.delete")}
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      ) : null}
    </div>
  )
}
