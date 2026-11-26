import { useSearchParams } from "react-router"

import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useListTableParams } from "@/shared/hooks/use-list-table-params"
import {
  parsePageParam,
  parsePageSizeParam,
} from "@/util/pagination"

const SEARCH_PARAM = "search"

export function useBranchListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const table = useListTableParams()
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))
  const search = searchParams.get(SEARCH_PARAM) ?? ""
  const hasFilters = Boolean(search || table.hasFilters)

  function patchParams(
    updates: Record<string, string | null>,
    resetPage = true
  ) {
    const next = new URLSearchParams(searchParams)

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }

    if (resetPage) {
      next.delete(PAGE_PARAM)
    }

    setSearchParams(next)
  }

  function resetFilters() {
    const next = new URLSearchParams()
    const limitValue = searchParams.get(PAGE_SIZE_PARAM)
    if (limitValue) {
      next.set(PAGE_SIZE_PARAM, limitValue)
    }
    setSearchParams(next)
  }

  return {
    page,
    limit,
    search,
    hasFilters,
    sorting: table.sorting,
    setSorting: table.setSorting,
    filters: table.filters,
    applyColumnDialog: table.applyColumnDialog,
    listParams: {
      page,
      limit,
      search: search || undefined,
      ...table.listSortParams,
      ...table.listFilterParams,
    },
    setSearch: (value: string) => patchParams({ [SEARCH_PARAM]: value }),
    resetFilters,
  }
}
