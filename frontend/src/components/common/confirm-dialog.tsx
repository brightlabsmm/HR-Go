import type { ReactNode } from "react"
import { cn } from "cn"
import { useTranslation } from "react-i18next"

import {
  ConfirmDialogOverlayBottom,
  ConfirmDialogOverlayTop,
} from "@/assets/icons/confirm-dialog-overlay"
import { PersonLockIcon } from "@/assets/icons/person-lock-icon"
import { PersonSuspendIcon } from "@/assets/icons/person-suspend-icon"
import { TrashCanIcon } from "@/assets/icons/trash-can-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ConfirmDialogIllustration = "trash" | "suspend" | "activate"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: "default" | "destructive"
  illustration?: ConfirmDialogIllustration
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function resolveIllustration(
  illustration: ConfirmDialogIllustration | undefined,
  confirmVariant: "default" | "destructive"
): ConfirmDialogIllustration {
  if (illustration) {
    return illustration
  }

  return confirmVariant === "destructive" ? "trash" : "activate"
}

function Illustration({
  kind,
}: {
  kind: ConfirmDialogIllustration
}): ReactNode {
  switch (kind) {
    case "suspend":
      return <PersonSuspendIcon className="size-[88px]" />
    case "activate":
      return <PersonLockIcon className="size-[88px]" />
    case "trash":
    default:
      return <TrashCanIcon className="size-[112px]" />
  }
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "destructive",
  illustration,
  isPending = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation("common")
  const resolvedIllustration = resolveIllustration(illustration, confirmVariant)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden sm:max-w-[400px]",
          "gap-0 p-0"
        )}
      >
        <ConfirmDialogOverlayTop className="pointer-events-none absolute -left-2 -top-2 z-0 size-[140px]" />
        <ConfirmDialogOverlayBottom className="pointer-events-none absolute -bottom-6 -right-4 z-0 size-32" />

        <div className="relative flex flex-col items-center px-6 pt-10 pb-2 text-center">
          <div className="mb-5 flex items-center justify-center">
            <Illustration kind={resolvedIllustration} />
          </div>

          <DialogHeader className="items-center gap-2 text-center sm:text-center">
            <DialogTitle className="text-center text-xl font-bold text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="relative flex flex-row gap-3 px-6 pt-6 pb-6 sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className="min-w-0 flex-1"
            loading={isPending}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("actions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
