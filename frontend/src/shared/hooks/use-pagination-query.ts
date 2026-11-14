import { useCallback } from "react"
import { useSearchParams } from "react-router"

import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import {
  buildPaginationSearch,
  parsePageParam,
  parsePageSizeParam,
} from "@/util/pagination"

export function usePaginationQuery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const replaceParams = useCallback(
    (nextPage: number, nextLimit: number) => {
      const search = buildPaginationSearch(searchParams, {
        page: nextPage,
        limit: nextLimit,
      })
      setSearchParams(new URLSearchParams(search.replace(/^\?/, "")), {
        replace: false,
      })
    },
    [searchParams, setSearchParams]
  )

  const setPage = useCallback(
    (nextPage: number) => {
      replaceParams(nextPage, limit)
    },
    [limit, replaceParams]
  )

  const setLimit = useCallback(
    (nextLimit: number) => {
      replaceParams(1, nextLimit)
    },
    [replaceParams]
  )

  return {
    page,
    limit,
    setPage,
    setLimit,
  }
}
