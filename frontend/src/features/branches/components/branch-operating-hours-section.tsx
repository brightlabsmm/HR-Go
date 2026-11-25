import { useMemo, useState } from "react"
import { SaveIcon } from "lucide-react"

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

  function updateDay(index: number, patch: Partial<OperatingHourInput>) {
    setDraft((prev) => {
      const base = [...(prev ?? defaultRows)]
      base[index] = { ...base[index], ...patch }
      return base
    })
  }

  function handleSave() {
    upsertMutation.mutate(
      { branchId, hours: rows },
      {
        onSuccess: () => {
          setDraft(null)
          toast.success("Operating hours saved.")
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
            Operating Hours
          </h2>
          <p className="text-small-2 text-muted-foreground">
            Weekly branch opening and closing schedule.
          </p>
        </div>
        {canUpdate && (
          <Button
            type="button"
            size="sm"
            loading={upsertMutation.isPending}
            onClick={handleSave}
          >
            <SaveIcon className="size-4" />
            Save Schedule
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-hair">
        <table className="w-full text-small-2">
          <thead className="border-b border-hair bg-subtle text-left font-medium text-muted-foreground">
            <tr>
              <th className="p-3">Day</th>
              <th className="p-3">Closed</th>
              <th className="p-3">Opening Time</th>
              <th className="p-3">Closing Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {rows.map((row, idx) => (
              <tr key={row.dayOfWeek} className="hover:bg-subtle/40">
                <td className="p-3 font-medium text-foreground">
                  {row.dayOfWeek}
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
