import { compactParams } from "@/util/compact-params"

export type SortOrder = "asc" | "desc"

export interface ListQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string[]
  sortOrder?: SortOrder[]
  filter?: string[]
}

export function toApiStatus(status?: string) {
  return status ? status.toUpperCase() : undefined
}

export function toListQuery<T extends ListQueryParams>(params?: T) {
  if (!params) {
    return undefined
  }

  const { page, limit, search, status, sortBy, sortOrder, filter, ...rest } =
    params

  return compactParams({
    page,
    pageSize: limit,
    q: search,
    status: toApiStatus(status),
    sortBy,
    sortOrder,
    filter,
    ...rest,
  })
}
