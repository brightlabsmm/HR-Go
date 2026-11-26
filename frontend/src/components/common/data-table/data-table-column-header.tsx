import { useState, type MouseEvent } from "react"
import type { SortingState } from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import type { DataTableColumnFilterMeta } from "@/components/common/data-table/data-table-columns"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [draftOp, setDraftOp] = useState<ColumnFilterOp>("ilike")
  const [draftValue, setDraftValue] = useState("")
  const [valueError, setValueError] = useState(false)

  function syncDraftFromActive() {
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

  function applySort(direction: "asc" | "desc") {
    onColumnDialogApply?.({
      sorting: upsertColumnSort(sorting, columnId, direction),
      filterField: filterMeta?.field,
      filter: activeFilter ?? undefined,
    })
    setOpen(false)
  }

  function applyFilter() {
    if (canFilter && filterMeta && opNeedsValue(draftOp) && !draftValue.trim()) {
      setValueError(true)
      return
    }

    onColumnDialogApply?.({
      sorting,
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
  const valueItems = filterMeta?.options ?? []
  const needsValue = opNeedsValue(draftOp)
  const hasActive = Boolean(sorted || activeFilter)

  const menuItemClass = cn(
    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
    "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
  )

  return (
    <div className="inline-flex items-center gap-0.5">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          aria-label={t("table.column_menu", { column: title })}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 h-8 gap-1.5 px-2 text-small-2 font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
            (sorted || activeFilter) && "text-foreground"
          )}
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
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={4}
          className="w-64 p-1"
        >
          {canSort ? (
            <div className="flex flex-col gap-0.5 p-0.5">
              <button
                type="button"
                className={cn(
                  menuItemClass,
                  sorted === "asc" && "bg-accent text-accent-foreground"
                )}
                onClick={() => applySort("asc")}
              >
                <ArrowUpIcon className="size-4 shrink-0" aria-hidden />
                {t("table.sort_asc")}
              </button>
              <button
                type="button"
                className={cn(
                  menuItemClass,
                  sorted === "desc" && "bg-accent text-accent-foreground"
                )}
                onClick={() => applySort("desc")}
              >
                <ArrowDownIcon className="size-4 shrink-0" aria-hidden />
                {t("table.sort_desc")}
              </button>
            </div>
          ) : null}

          {canFilter && filterMeta ? (
            <>
              {canSort ? (
                <div className="my-1 h-px bg-border" role="separator" />
              ) : null}
              <div className="grid gap-2 p-2">
                {ops.length > 1 ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor={`op-${columnId}`} className="text-xs">
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
                      <SelectTrigger id={`op-${columnId}`} size="sm" className="h-8">
                        <SelectValue className="text-small-1" />
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
                ) : null}

                {needsValue ? (
                  <div className="grid gap-1.5">
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
                          size="sm"
                          className="h-8"
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
                      <div className="relative">
                        <SearchIcon
                          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <Input
                          id={`value-${columnId}`}
                          value={draftValue}
                          aria-invalid={valueError}
                          className="h-4 pl-7 text-small-1"
                          onChange={(event) => {
                            setDraftValue(event.target.value)
                            setValueError(false)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              applyFilter()
                            }
                          }}
                          placeholder={
                            filterMeta.placeholder ??
                            t("table.filter_search_placeholder")
                          }
                        />
                      </div>
                    )}
                    {valueError ? (
                      <p className="text-small-2 text-destructive">
                        {t("table.filter_value_required")}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={applyFilter}
                  >
                    {t("actions.apply")}
                  </Button>
                </div>
                
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={clearAll}
                    disabled={!hasActive}
                  >
                    {t("table.clear_column")}
                  </Button>
              </div>
            </>
          ) : canSort ? (
            <>
              <div className="my-1 h-px bg-border" role="separator" />
              <div className="p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full"
                  onClick={clearAll}
                  disabled={!hasActive}
                >
                  {t("table.clear_column")}
                </Button>
              </div>
            </>
          ) : null}
        </PopoverContent>
      </Popover>

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
  )
}
