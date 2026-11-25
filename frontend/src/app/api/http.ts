import type { AxiosResponse } from "axios"

import {
  type PageMeta,
  type PageResponse,
  type Paginated,
} from "@/app/api/types"

const EMPTY_META: PageMeta = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
}

export async function unwrap<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
  const response = await request
  return response.data
}

export async function unwrapEmpty(
  request: Promise<AxiosResponse<unknown>>
): Promise<void> {
  await request
}

export async function unwrapPage<T>(
  request: Promise<AxiosResponse<PageResponse<T>>>
): Promise<Paginated<T>> {
  const response = await request
  const body = response.data
  const p = body.pagination

  return {
    items: body.items ?? [],
    meta: {
      page: body.page ?? p?.page ?? EMPTY_META.page,
      pageSize: body.pageSize ?? p?.pageSize ?? EMPTY_META.pageSize,
      totalItems: body.totalItems ?? p?.total ?? EMPTY_META.totalItems,
      totalPages: body.totalPages ?? p?.totalPages ?? EMPTY_META.totalPages,
    },
  }
}
