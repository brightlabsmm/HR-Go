import { useMemo, useState } from "react"
import { SaveIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { notifyApiError } from "@/app/api/feedback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useBranchOperatingHoursQuery,
  useUpsertBranchOperatingHoursMutation,
} from "@/shared/queries/branch-hours.query"
import type {
  DayOfWeek,
  OperatingHourInput,
} from "@/shared/services/branch-hours.service"
import { toast } from "@/shared/stores/toast.store"

const DAYS_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

export function BranchOperatingHoursSection({
  branchId,
}: {
  branchId: string
}) {
  const { t } = useTranslation("branches")
  const { can } = usePermissions()
  const canUpdate = can("org.branch.update")
  const hoursQuery = useBranchOperatingHoursQuery(branchId)
  const upsertMutation = useUpsertBranchOperatingHoursMutation()

  const defaultRows = useMemo<OperatingHourInput[]>(() => {
    const existingMap = new Map(
      (hoursQuery.data ?? []).map((item) => [item.dayOfWeek, item])
    )
    return DAYS_ORDER.map((day) => {
      const existing = existingMap.get(day)
      if (existing) {
        return {
          dayOfWeek: day,
          openingTime: existing.openingTime,
          closingTime: existing.closingTime,
          isClosed: existing.isClosed,
        }
      }
      const isWeekend = day === "SATURDAY" || day === "SUNDAY"
      return {
        dayOfWeek: day,
        openingTime: isWeekend ? null : "09:00",
        closingTime: isWeekend ? null : "18:00",
        isClosed: isWeekend,
      }
    })
  }, [hoursQuery.data])

  const [draft, setDraft] = useState<OperatingHourInput[] | null>(null)
  const rows = draft ?? defaultRows

  const hasInvalidTimes = rows.some(
    (row) =>
      !row.isClosed &&
      (!row.openingTime ||
        !row.closingTime ||
        row.closingTime <= row.openingTime)
  )

  function updateDay(index: number, patch: Partial<OperatingHourInput>) {
    setDraft((prev) => {
      const base = [...(prev ?? defaultRows)]
      base[index] = { ...base[index], ...patch }
      return base
    })
  }

  function handleSave() {
    if (hasInvalidTimes) {
      toast.error(t("operating_hours.invalid_time"))
      return
    }
    upsertMutation.mutate(
      { branchId, hours: rows },
      {
        onSuccess: () => {
          setDraft(null)
          toast.success(t("operating_hours.saved"))
        },
        onError: (err) => notifyApiError(err),
      }
    )
  }

  return (
    <section className="border-t border-hair pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-body-2 font-semibold text-foreground">
            {t("operating_hours.title")}
          </h2>
          <p className="text-small-2 text-muted-foreground">
            {t("operating_hours.description")}
          </p>
        </div>
        {canUpdate && (
          <Button
            type="button"
            size="sm"
            loading={upsertMutation.isPending}
            disabled={hasInvalidTimes}
            onClick={handleSave}
          >
            <SaveIcon className="size-4" />
            {t("operating_hours.save")}
          </Button>
        )}
      </div>

      {hasInvalidTimes && (
        <p className="mb-3 text-xs text-destructive">
          {t("operating_hours.invalid_time")}
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-hair">
        <table className="w-full text-small-2">
          <thead className="border-b border-hair bg-subtle text-left font-medium text-muted-foreground">
            <tr>
              <th className="p-3">{t("operating_hours.day")}</th>
              <th className="p-3">{t("operating_hours.closed")}</th>
              <th className="p-3">{t("operating_hours.opening_time")}</th>
              <th className="p-3">{t("operating_hours.closing_time")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {rows.map((row, idx) => (
              <tr key={row.dayOfWeek} className="hover:bg-subtle/40">
                <td className="p-3 font-medium text-foreground">
                  {t(`operating_hours.days.${row.dayOfWeek}`)}
                </td>
                <td className="p-3">
                  <Switch
                    disabled={!canUpdate}
                    checked={row.isClosed}
                    onCheckedChange={(checked) =>
                      updateDay(idx, {
                        isClosed: checked,
                        openingTime: checked ? null : row.openingTime ?? "09:00",
                        closingTime: checked ? null : row.closingTime ?? "18:00",
                      })
                    }
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="time"
                    disabled={!canUpdate || row.isClosed}
                    value={row.openingTime ?? ""}
                    onChange={(e) =>
                      updateDay(idx, { openingTime: e.target.value || null })
                    }
                    className="h-8 w-36"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="time"
                    disabled={!canUpdate || row.isClosed}
                    value={row.closingTime ?? ""}
                    onChange={(e) =>
                      updateDay(idx, { closingTime: e.target.value || null })
                    }
                    className="h-8 w-36"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
