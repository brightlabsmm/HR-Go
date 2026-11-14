import { useSearchParams } from "react-router"

import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import {
  parsePageParam,
  parsePageSizeParam,
} from "@/util/pagination"

const SEARCH_PARAM = "search"
const STATUS_PARAM = "status"

function parseStatus(value: string | null) {
  if (value === "active" || value === "inactive") {
    return value
  }

  return undefined
}

export function useBranchListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))
  const search = searchParams.get(SEARCH_PARAM) ?? ""
  const status = parseStatus(searchParams.get(STATUS_PARAM))
  const hasFilters = Boolean(search || status)

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
    status,
    hasFilters,
    listParams: {
      page,
      limit,
      search: search || undefined,
      status,
    },
    setSearch: (value: string) => patchParams({ [SEARCH_PARAM]: value }),
    setStatus: (value: string) =>
      patchParams({
        [STATUS_PARAM]: value === "all" ? null : value,
      }),
    resetFilters,
  }
}
