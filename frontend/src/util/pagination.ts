import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PAGE_PARAM,
  PAGE_SIZE_PARAM,
  PAGE_SIZE_OPTIONS,
} from "@/constants/pagination"

export type PageItem = number | "ellipsis"

export function parsePageParam(value: string | null) {
  if (!value) {
    return DEFAULT_PAGE
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE
  }

  return parsed
}

export function parsePageSizeParam(value: string | null) {
  if (!value) {
    return DEFAULT_PAGE_SIZE
  }

  const parsed = Number.parseInt(value, 10)
  const isAllowed = (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)

  if (!isAllowed || parsed < 1 || parsed > MAX_PAGE_SIZE) {
    return DEFAULT_PAGE_SIZE
  }

  return parsed
}

export function getPageRange(page: number, limit: number, total: number) {
  if (total <= 0) {
    return { from: 0, to: 0 }
  }

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return { from, to }
}

export function getVisiblePages(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 0) {
    return []
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: PageItem[] = [1]
  const windowStart = Math.max(2, current - 1)
  const windowEnd = Math.min(totalPages - 1, current + 1)

  if (windowStart > 2) {
    items.push("ellipsis")
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page)
  }

  if (windowEnd < totalPages - 1) {
    items.push("ellipsis")
  }

  items.push(totalPages)
  return items
}

export function buildPaginationSearch(
  current: URLSearchParams,
  next: { page: number; limit: number }
) {
  const params = new URLSearchParams(current)

  if (next.page <= DEFAULT_PAGE) {
    params.delete(PAGE_PARAM)
  } else {
    params.set(PAGE_PARAM, String(next.page))
  }

  if (next.limit === DEFAULT_PAGE_SIZE) {
    params.delete(PAGE_SIZE_PARAM)
  } else {
    params.set(PAGE_SIZE_PARAM, String(next.limit))
  }

  const search = params.toString()
  return search ? `?${search}` : ""
}
