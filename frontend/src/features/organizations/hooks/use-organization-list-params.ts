import { useSearchParams } from "react-router"

import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useListSort } from "@/shared/hooks/use-list-sort"
import {
  parsePageParam,
  parsePageSizeParam,
} from "@/util/pagination"

const STATUSES = ["pending", "active", "suspended"] as const

function parseStatus(value: string | null) {
  if (value && STATUSES.includes(value as (typeof STATUSES)[number])) {
    return value
  }

  return undefined
}

export function useOrganizationListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { sorting, setSorting, listSortParams } = useListSort()
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))
  const search = searchParams.get("search") ?? ""
  const status = parseStatus(searchParams.get("status"))

  function patchParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    next.delete(PAGE_PARAM)
    setSearchParams(next)
  }

  return {
    page,
    limit,
    search,
    status,
    hasFilters: Boolean(search || status),
    resetFilters: () => patchParams({ search: null, status: null }),
    sorting,
    setSorting,
    listParams: {
      page,
      limit,
      search: search || undefined,
      status,
      ...listSortParams,
    },
    setSearch: (value: string) => patchParams({ search: value }),
    setStatus: (value: string) =>
      patchParams({ status: value === "all" ? null : value }),
  }
}
