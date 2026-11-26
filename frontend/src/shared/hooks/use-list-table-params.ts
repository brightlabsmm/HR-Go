import type { SortingState, Updater } from "@tanstack/react-table"
import { useSearchParams } from "react-router"

import { PAGE_PARAM } from "@/constants/pagination"
import {
  findColumnFilter,
  parseColumnFilter,
  serializeColumnFilter,
  toFilterQueryParams,
  upsertColumnFilter,
  type ColumnFilterValue,
} from "@/util/column-filter"

const SORT_BY_PARAM = "sortBy"
const SORT_ORDER_PARAM = "sortOrder"
const FILTER_PARAM = "filter"

function expand(values: string[]) {
  return values.flatMap((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  )
}

function toSorting(sortBy: string[], sortOrder: string[]): SortingState {
  return sortBy.map((id, index) => {
    const order = (sortOrder[index] ?? sortOrder[0] ?? "desc").toLowerCase()
    return { id, desc: order !== "asc" }
  })
}

function writeSorting(next: URLSearchParams, sorting: SortingState) {
  next.delete(SORT_BY_PARAM)
  next.delete(SORT_ORDER_PARAM)
  if (sorting.length > 0) {
    next.set(SORT_BY_PARAM, sorting.map((item) => item.id).join(","))
    next.set(
      SORT_ORDER_PARAM,
      sorting.map((item) => (item.desc ? "desc" : "asc")).join(",")
    )
  }
}

function writeFilters(next: URLSearchParams, filters: ColumnFilterValue[]) {
  next.delete(FILTER_PARAM)
  for (const filter of filters) {
    const serialized = serializeColumnFilter(filter)
    if (serialized) {
      next.append(FILTER_PARAM, serialized)
    }
  }
}

export interface ColumnDialogApply {
  sorting: SortingState
  filterField?: string
  filter?: ColumnFilterValue | null
}

export function useListTableParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortBy = expand(searchParams.getAll(SORT_BY_PARAM))
  const sortOrder = expand(searchParams.getAll(SORT_ORDER_PARAM))
  const sorting = toSorting(sortBy, sortOrder)
  const filters = searchParams
    .getAll(FILTER_PARAM)
    .map(parseColumnFilter)
    .filter((value): value is ColumnFilterValue => value !== null)

  function setSorting(updater: Updater<SortingState>) {
    setSearchParams((current) => {
      const currentSortBy = expand(current.getAll(SORT_BY_PARAM))
      const currentSortOrder = expand(current.getAll(SORT_ORDER_PARAM))
      const currentSorting = toSorting(currentSortBy, currentSortOrder)
      const nextSorting =
        typeof updater === "function" ? updater(currentSorting) : updater
      const next = new URLSearchParams(current)
      next.delete(PAGE_PARAM)
      writeSorting(next, nextSorting)
      return next
    })
  }

  function setColumnFilter(field: string, filter: ColumnFilterValue | null) {
    setSearchParams((current) => {
      const currentFilters = current
        .getAll(FILTER_PARAM)
        .map(parseColumnFilter)
        .filter((value): value is ColumnFilterValue => value !== null)
      const next = new URLSearchParams(current)
      next.delete(PAGE_PARAM)
      writeFilters(next, upsertColumnFilter(currentFilters, filter, field))
      return next
    })
  }

  function applyColumnDialog(update: ColumnDialogApply) {
    setSearchParams((current) => {
      const currentFilters = current
        .getAll(FILTER_PARAM)
        .map(parseColumnFilter)
        .filter((value): value is ColumnFilterValue => value !== null)
      const next = new URLSearchParams(current)
      next.delete(PAGE_PARAM)
      writeSorting(next, update.sorting)
      if (update.filterField !== undefined) {
        writeFilters(
          next,
          upsertColumnFilter(
            currentFilters,
            update.filter ?? null,
            update.filterField
          )
        )
      }
      return next
    })
  }

  function clearAllFilters() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete(FILTER_PARAM)
      next.delete(PAGE_PARAM)
      return next
    })
  }

  function clearFiltersAndSort() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete(FILTER_PARAM)
      next.delete(SORT_BY_PARAM)
      next.delete(SORT_ORDER_PARAM)
      next.delete(PAGE_PARAM)
      return next
    })
  }

  return {
    sorting,
    setSorting,
    filters,
    setColumnFilter,
    applyColumnDialog,
    clearAllFilters,
    clearFiltersAndSort,
    hasFilters: filters.length > 0,
    getColumnFilter: (field: string) => findColumnFilter(filters, field),
    listSortParams: {
      sortBy: sortBy.length > 0 ? sortBy : undefined,
      sortOrder:
        sortBy.length > 0
          ? sortBy.map((_, index) =>
              (sortOrder[index] ?? sortOrder[0] ?? "desc").toLowerCase() ===
              "asc"
                ? ("asc" as const)
                : ("desc" as const)
            )
          : undefined,
    },
    listFilterParams: {
      filter: toFilterQueryParams(filters),
    },
  }
}
