import { useState } from "react"
import { AlertTriangleIcon, ClockIcon, ShieldAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { Organization } from "@/shared/services/organization.service"

export interface SuspendDialogConfirmPayload {
  immediate: boolean
  notifyFrom?: string
  notifyTo?: string
  suspendAt?: string
  reason?: string
}

export interface SuspendDialogValidationResult {
  valid: boolean
  error?: string
}

export function validateSuspendInput(params: {
  confirmed: boolean
  mode: "immediate" | "scheduled"
  suspendAt?: string
  notifyFrom?: string
  notifyTo?: string
  now?: number
}): SuspendDialogValidationResult {
  if (!params.confirmed) {
    return { valid: false, error: "Please confirm that you understand the impact." }
  }

  if (params.mode === "immediate") {
    return { valid: true }
  }

  if (!params.suspendAt) {
    return { valid: false, error: "Suspend date and time is required." }
  }

  const now = params.now ?? Date.now()
  const suspendDate = new Date(params.suspendAt)
  if (suspendDate.getTime() <= now) {
    return { valid: false, error: "Scheduled suspend date must be in the future." }
  }

  if (params.notifyFrom && params.notifyTo) {
    const fromDate = new Date(params.notifyFrom)
    const toDate = new Date(params.notifyTo)
    if (fromDate.getTime() > toDate.getTime()) {
      return { valid: false, error: "Notification start date cannot be after end date." }
    }
  }

  if (params.notifyTo) {
    const toDate = new Date(params.notifyTo)
    if (toDate.getTime() > suspendDate.getTime()) {
      return { valid: false, error: "Notification end date cannot be after suspension date." }
    }
  }

  if (params.notifyFrom) {
    const fromDate = new Date(params.notifyFrom)
    if (fromDate.getTime() > suspendDate.getTime()) {
      return { valid: false, error: "Notification start date cannot be after suspension date." }
    }
  }

  return { valid: true }
}

interface OrganizationSuspendDialogProps {
  open: boolean
  organization: Organization | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: SuspendDialogConfirmPayload) => void
}

export function OrganizationSuspendDialog({
  open,
  organization,
  isPending,
  onOpenChange,
  onConfirm,
}: OrganizationSuspendDialogProps) {
  const { t } = useTranslation("organizations")
  const { t: tCommon } = useTranslation("common")

  const [mode, setMode] = useState<"immediate" | "scheduled">("immediate")
  const [reason, setReason] = useState("")
  const [notifyFrom, setNotifyFrom] = useState("")
  const [notifyTo, setNotifyTo] = useState("")
  const [suspendAt, setSuspendAt] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleReset() {
    setMode("immediate")
    setReason("")
    setNotifyFrom("")
    setNotifyTo("")
    setSuspendAt("")
    setConfirmed(false)
    setValidationError(null)
  }

  function handleSubmit() {
    setValidationError(null)

    const result = validateSuspendInput({
      confirmed,
      mode,
      suspendAt,
      notifyFrom,
      notifyTo,
    })

    if (!result.valid) {
      setValidationError(result.error ?? "Invalid input")
      return
    }

    if (mode === "immediate") {
      onConfirm({
        immediate: true,
        reason: reason.trim() || undefined,
      })
      return
    }

    const suspendDate = new Date(suspendAt)
    onConfirm({
      immediate: false,
      notifyFrom: notifyFrom ? new Date(notifyFrom).toISOString() : undefined,
      notifyTo: notifyTo ? new Date(notifyTo).toISOString() : undefined,
      suspendAt: suspendDate.toISOString(),
      reason: reason.trim() || undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleReset()
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-[32rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlertIcon className="size-5 text-destructive" />
            {t("suspend_dialog.title", {
              name: organization?.displayName ?? organization?.legalName ?? "",
              defaultValue: `Suspend ${organization?.displayName ?? "Organization"}`,
            })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "suspend_dialog.subtitle",
              "Choose whether to suspend immediately and revoke all user sessions, or schedule a future suspension with advance warning."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-hair bg-muted/30 p-1">
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-colors ${
                mode === "immediate"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setMode("immediate")
                setValidationError(null)
              }}
            >
              <AlertTriangleIcon className="size-3.5 text-destructive" />
              {t("suspend_dialog.immediate_tab", "Suspend Immediately")}
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-colors ${
                mode === "scheduled"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setMode("scheduled")
                setValidationError(null)
              }}
            >
              <ClockIcon className="size-3.5 text-amber-500" />
              {t("suspend_dialog.scheduled_tab", "Schedule Suspension")}
            </button>
          </div>

          {/* Mode descriptions */}
          {mode === "immediate" ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="font-semibold">{t("suspend_dialog.immediate_notice_title", "Immediate Session Revocation")}</p>
              <p className="mt-1 opacity-90">
                {t(
                  "suspend_dialog.immediate_notice_body",
                  "All active user sessions across this workspace will be revoked immediately. Users currently logged in will be disconnected and unable to access the system."
                )}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold">{t("suspend_dialog.scheduled_notice_title", "Automated Suspension & User Notice")}</p>
              <p className="mt-1 opacity-90">
                {t(
                  "suspend_dialog.scheduled_notice_body",
                  "During the notification period, workspace users will see a warning banner. When the scheduled time arrives, the background scheduler will automatically suspend the organization and revoke all active sessions."
                )}
              </p>
            </div>
          )}

          {/* Scheduled Fields */}
          {mode === "scheduled" ? (
            <div className="space-y-3 rounded-lg border border-hair p-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="notifyFrom" className="text-xs">
                    {t("suspend_dialog.notify_from", "Notify From (Optional)")}
                  </Label>
                  <Input
                    id="notifyFrom"
                    type="datetime-local"
                    value={notifyFrom}
                    onChange={(e) => setNotifyFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notifyTo" className="text-xs">
                    {t("suspend_dialog.notify_to", "Notify To (Optional)")}
                  </Label>
                  <Input
                    id="notifyTo"
                    type="datetime-local"
                    value={notifyTo}
                    onChange={(e) => setNotifyTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="suspendAt" className="text-xs font-semibold">
                  {t("suspend_dialog.suspend_at", "Suspend Date & Time *")}
                </Label>
                <Input
                  id="suspendAt"
                  type="datetime-local"
                  required
                  value={suspendAt}
                  onChange={(e) => setSuspendAt(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          ) : null}

          {/* Reason */}
          <div className="space-y-1">
            <Label htmlFor="suspendReason" className="text-xs">
              {t("suspend_dialog.reason_label", "Reason (Optional)")}
            </Label>
            <Textarea
              id="suspendReason"
              rows={2}
              placeholder={t("suspend_dialog.reason_placeholder", "e.g., Billing renewal overdue, contract expiration")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none text-xs"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="suspendConfirmation"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked)
                if (e.target.checked) setValidationError(null)
              }}
              className="mt-0.5 size-4 rounded border-hair text-primary focus:ring-primary"
            />
            <Label
              htmlFor="suspendConfirmation"
              className="cursor-pointer text-xs font-medium leading-tight text-foreground select-none"
            >
              {mode === "immediate"
                ? t(
                    "suspend_dialog.immediate_confirm_check",
                    "I confirm that this organization should be suspended immediately and all active sessions revoked."
                  )
                : t(
                    "suspend_dialog.scheduled_confirm_check",
                    "I confirm scheduling this suspension and understand it will automatically take effect on the specified date."
                  )}
            </Label>
          </div>

          {/* Validation Error */}
          {validationError ? (
            <p className="text-xs font-medium text-destructive">{validationError}</p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              handleReset()
              onOpenChange(false)
            }}
          >
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant={mode === "immediate" ? "destructive" : "default"}
            loading={isPending}
            disabled={!confirmed}
            onClick={handleSubmit}
          >
            {mode === "immediate"
              ? t("status_actions.suspend", "Suspend Immediately")
              : t("suspend_dialog.schedule_button", "Schedule Suspension")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
