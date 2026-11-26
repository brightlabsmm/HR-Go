import { useState, type MouseEvent } from "react"
import type { SortingState } from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  FilterIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import type { DataTableColumnFilterMeta } from "@/components/common/data-table/data-table-columns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ColumnDialogApply } from "@/shared/hooks/use-list-table-params"
import {
  findColumnFilter,
  opNeedsValue,
  SELECT_FILTER_OPS,
  TEXT_FILTER_OPS,
  type ColumnFilterOp,
  type ColumnFilterValue,
} from "@/util/column-filter"

interface DataTableColumnHeaderProps {
  title: string
  columnId: string
  canSort?: boolean
  sorted?: false | "asc" | "desc"
  sortIndex?: number
  sorting?: SortingState
  filterMeta?: DataTableColumnFilterMeta
  columnFilters?: ColumnFilterValue[]
  onColumnDialogApply?: (update: ColumnDialogApply) => void
}

type SortDirection = "asc" | "desc" | "none"

function upsertColumnSort(
  sorting: SortingState,
  columnId: string,
  direction: SortDirection
): SortingState {
  const rest = sorting.filter((item) => item.id !== columnId)
  if (direction === "none") {
    return rest
  }
  return [{ id: columnId, desc: direction === "desc" }, ...rest]
}

function defaultOps(filterMeta: DataTableColumnFilterMeta): ColumnFilterOp[] {
  if (filterMeta.ops && filterMeta.ops.length > 0) {
    return filterMeta.ops
  }
  return filterMeta.valueType === "select" ? SELECT_FILTER_OPS : TEXT_FILTER_OPS
}

function defaultOp(filterMeta: DataTableColumnFilterMeta): ColumnFilterOp {
  if (filterMeta.defaultOp) {
    return filterMeta.defaultOp
  }
  return filterMeta.valueType === "select" ? "eq" : "ilike"
}

export function DataTableColumnHeader({
  title,
  columnId,
  canSort = false,
  sorted = false,
  sortIndex,
  sorting = [],
  filterMeta,
  columnFilters = [],
  onColumnDialogApply,
}: DataTableColumnHeaderProps) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const activeFilter = filterMeta
    ? findColumnFilter(columnFilters, filterMeta.field)
    : null
  const canFilter = Boolean(filterMeta)
  const canOpen = Boolean(onColumnDialogApply) && (canSort || canFilter)
  const SortIcon =
    sorted === "asc"
      ? ArrowUpIcon
      : sorted === "desc"
        ? ArrowDownIcon
        : ArrowUpDownIcon
  const ops = filterMeta ? defaultOps(filterMeta) : []
  const [draftSort, setDraftSort] = useState<SortDirection>("none")
  const [draftOp, setDraftOp] = useState<ColumnFilterOp>("ilike")
  const [draftValue, setDraftValue] = useState("")
  const [valueError, setValueError] = useState(false)

  function syncDraftFromActive() {
    setDraftSort(sorted === "asc" ? "asc" : sorted === "desc" ? "desc" : "none")
    setValueError(false)
    if (filterMeta) {
      setDraftOp(activeFilter?.op ?? defaultOp(filterMeta))
      setDraftValue(activeFilter?.value ?? "")
      return
    }
    setDraftOp("ilike")
    setDraftValue("")
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      syncDraftFromActive()
    }
    setOpen(nextOpen)
  }

  if (!canOpen) {
    return (
      <span className="text-small-2 font-medium text-muted-foreground">
        {title}
      </span>
    )
  }

  function buildFilter(): ColumnFilterValue | null {
    if (!filterMeta) {
      return null
    }
    if (!opNeedsValue(draftOp)) {
      return { field: filterMeta.field, op: draftOp, value: "" }
    }
    if (!draftValue.trim()) {
      return null
    }
    return {
      field: filterMeta.field,
      op: draftOp,
      value: draftValue.trim(),
    }
  }

  function apply() {
    const nextSorting = canSort
      ? upsertColumnSort(sorting, columnId, draftSort)
      : sorting

    if (canFilter && filterMeta && opNeedsValue(draftOp) && !draftValue.trim()) {
      setValueError(true)
      return
    }

    onColumnDialogApply?.({
      sorting: nextSorting,
      filterField: filterMeta?.field,
      filter: canFilter ? buildFilter() : undefined,
    })
    setOpen(false)
  }

  function clearAll() {
    onColumnDialogApply?.({
      sorting: canSort
        ? upsertColumnSort(sorting, columnId, "none")
        : sorting,
      filterField: filterMeta?.field,
      filter: canFilter ? null : undefined,
    })
    setOpen(false)
  }

  function clearFilter(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (!filterMeta) {
      return
    }
    onColumnDialogApply?.({
      sorting,
      filterField: filterMeta.field,
      filter: null,
    })
  }

  const opItems = ops.map((op) => ({
    value: op,
    label: t(`table.filter_ops.${op}`),
  }))
  const sortItems = [
    { value: "none", label: t("table.sort_none") },
    { value: "asc", label: t("table.sort_asc") },
    { value: "desc", label: t("table.sort_desc") },
  ]
  const valueItems = filterMeta?.options ?? []
  const needsValue = opNeedsValue(draftOp)

  return (
    <>
      <div className="inline-flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "-ml-2 h-8 gap-1.5 px-2 text-small-2 font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
            (sorted || activeFilter) && "text-foreground"
          )}
          onClick={() => handleOpenChange(true)}
          aria-label={t("table.column_menu", { column: title })}
        >
          {title}
          {canSort ? <SortIcon className="size-3.5" aria-hidden /> : null}
          {activeFilter ? (
            <FilterIcon className="size-3.5 text-primary" aria-hidden />
          ) : null}
          {typeof sortIndex === "number" && sortIndex >= 0 ? (
            <span className="rounded-sm bg-muted px-1 text-[10px] leading-4 text-muted-foreground">
              {sortIndex + 1}
            </span>
          ) : null}
        </Button>
        {activeFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={clearFilter}
            aria-label={t("table.clear_filter", { column: title })}
          >
            <XIcon className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {t("table.column_dialog_title", { column: title })}
            </DialogTitle>
            <DialogDescription>
              {t("table.column_dialog_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {canSort ? (
              <div className="grid gap-2">
                <Label htmlFor={`sort-${columnId}`}>{t("table.sort")}</Label>
                <Select
                  items={sortItems}
                  value={draftSort}
                  onValueChange={(value) => {
                    if (value === "asc" || value === "desc" || value === "none") {
                      setDraftSort(value)
                    }
                  }}
                >
                  <SelectTrigger id={`sort-${columnId}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {canFilter && filterMeta ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor={`op-${columnId}`}>
                    {t("table.filter_operator")}
                  </Label>
                  <Select
                    items={opItems}
                    value={draftOp}
                    onValueChange={(value) => {
                      if (value) {
                        setDraftOp(value as ColumnFilterOp)
                        setValueError(false)
                      }
                    }}
                  >
                    <SelectTrigger id={`op-${columnId}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {needsValue ? (
                  <div className="grid gap-2">
                    <Label htmlFor={`value-${columnId}`}>
                      {t("table.filter_value")}
                    </Label>
                    {filterMeta.valueType === "select" ? (
                      <Select
                        items={valueItems}
                        value={draftValue || null}
                        onValueChange={(value) => {
                          setDraftValue(value ?? "")
                          setValueError(false)
                        }}
                      >
                        <SelectTrigger
                          id={`value-${columnId}`}
                          aria-invalid={valueError}
                        >
                          <SelectValue
                            placeholder={t("table.filter_value_placeholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {valueItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`value-${columnId}`}
                        value={draftValue}
                        aria-invalid={valueError}
                        onChange={(event) => {
                          setDraftValue(event.target.value)
                          setValueError(false)
                        }}
                        placeholder={
                          filterMeta.placeholder ??
                          t("table.filter_search_placeholder")
                        }
                      />
                    )}
                    {valueError ? (
                      <p className="text-small-2 text-destructive">
                        {t("table.filter_value_required")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={clearAll}>
              {t("table.clear_column")}
            </Button>
            <Button type="button" onClick={apply}>
              {t("actions.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
