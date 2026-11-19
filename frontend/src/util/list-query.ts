import { compactParams } from "@/util/compact-params"

export function toApiStatus(status?: string) {
  return status ? status.toUpperCase() : undefined
}

interface ListQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function toListQuery<T extends ListQueryParams>(params?: T) {
  if (!params) {
    return undefined
  }

  const { page, limit, search, status, ...rest } = params

  return compactParams({
    page,
    pageSize: limit,
    q: search,
    status: toApiStatus(status),
    ...rest,
  })
}
