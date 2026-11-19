import type { SortingState, Updater } from "@tanstack/react-table"
import { useSearchParams } from "react-router"

import { PAGE_PARAM } from "@/constants/pagination"

const SORT_BY_PARAM = "sortBy"
const SORT_ORDER_PARAM = "sortOrder"

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

export function useListSort() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortBy = expand(searchParams.getAll(SORT_BY_PARAM))
  const sortOrder = expand(searchParams.getAll(SORT_ORDER_PARAM))
  const sorting = toSorting(sortBy, sortOrder)

  function setSorting(updater: Updater<SortingState>) {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater
    const next = new URLSearchParams(searchParams)

    next.delete(SORT_BY_PARAM)
    next.delete(SORT_ORDER_PARAM)
    next.delete(PAGE_PARAM)

    if (nextSorting.length > 0) {
      next.set(
        SORT_BY_PARAM,
        nextSorting.map((item) => item.id).join(",")
      )
      next.set(
        SORT_ORDER_PARAM,
        nextSorting.map((item) => (item.desc ? "desc" : "asc")).join(",")
      )
    }

    setSearchParams(next)
  }

  return {
    sorting,
    setSorting,
    listSortParams: {
      sortBy: sortBy.length > 0 ? sortBy : undefined,
      sortOrder:
        sortBy.length > 0
          ? sortBy.map((_, index) =>
              (sortOrder[index] ?? sortOrder[0] ?? "desc").toLowerCase() === "asc"
                ? ("asc" as const)
                : ("desc" as const)
            )
          : undefined,
    },
  }
}
