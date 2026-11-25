export interface PageMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  meta: PageMeta
}

export interface BackendPagination {
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface PageResponse<T> {
  items: T[]
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  pagination?: BackendPagination
}

export interface FieldIssue {
  field: string
  message: string
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: FieldIssue[]
  traceId?: string
}

export interface ApiFailure {
  error: ApiErrorBody
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: FieldIssue[]
  readonly traceId?: string

  constructor({
    status,
    code,
    message,
    details = [],
    traceId,
  }: {
    status: number
    code: string
    message: string
    details?: FieldIssue[]
    traceId?: string
  }) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
    this.traceId = traceId
  }
}

export function isApiFailure(value: unknown): value is ApiFailure {
  if (typeof value !== "object" || value === null) {
    return false
  }

  if (!("error" in value) || typeof value.error !== "object" || value.error === null) {
    return false
  }

  const error = value.error as Record<string, unknown>
  return typeof error.code === "string" && typeof error.message === "string"
}
