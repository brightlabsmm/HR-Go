export type ColumnFilterOp =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "in"
  | "isnull"
  | "notnull"

export interface ColumnFilterValue {
  field: string
  op: ColumnFilterOp
  value: string
}

export const TEXT_FILTER_OPS: ColumnFilterOp[] = [
  "ilike",
  "like",
  "eq",
  "ne",
  "isnull",
  "notnull",
]

export const SELECT_FILTER_OPS: ColumnFilterOp[] = [
  "eq",
  "ne",
  "in",
  "isnull",
  "notnull",
]

export const COMPARISON_FILTER_OPS: ColumnFilterOp[] = [
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "isnull",
  "notnull",
]

const VALUELESS_OPS = new Set<ColumnFilterOp>(["isnull", "notnull"])

export function opNeedsValue(op: ColumnFilterOp) {
  return !VALUELESS_OPS.has(op)
}

export function serializeColumnFilter(filter: ColumnFilterValue) {
  const field = filter.field.trim()
  const op = filter.op
  if (!field || !op) {
    return null
  }

  if (!opNeedsValue(op)) {
    return `${field}:${op}`
  }

  const value = filter.value.trim()
  if (!value) {
    return null
  }

  return `${field}:${op}:${value}`
}

export function parseColumnFilter(raw: string): ColumnFilterValue | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const fieldCut = trimmed.indexOf(":")
  if (fieldCut <= 0) {
    return null
  }

  const field = trimmed.slice(0, fieldCut).trim()
  const rest = trimmed.slice(fieldCut + 1)
  const opCut = rest.indexOf(":")
  const opRaw = (opCut < 0 ? rest : rest.slice(0, opCut)).trim().toLowerCase()
  const value = opCut < 0 ? "" : rest.slice(opCut + 1).trim()
  const op = opRaw as ColumnFilterOp

  if (!field || !isColumnFilterOp(op)) {
    return null
  }

  if (opNeedsValue(op) && !value) {
    return null
  }

  return { field, op, value }
}

export function isColumnFilterOp(value: string): value is ColumnFilterOp {
  return (
    value === "eq" ||
    value === "ne" ||
    value === "gt" ||
    value === "gte" ||
    value === "lt" ||
    value === "lte" ||
    value === "like" ||
    value === "ilike" ||
    value === "in" ||
    value === "isnull" ||
    value === "notnull"
  )
}

export function upsertColumnFilter(
  filters: ColumnFilterValue[],
  next: ColumnFilterValue | null,
  field: string
) {
  const withoutField = filters.filter(
    (item) => item.field.toLowerCase() !== field.toLowerCase()
  )
  if (!next) {
    return withoutField
  }
  return [...withoutField, next]
}

export function findColumnFilter(filters: ColumnFilterValue[], field: string) {
  return (
    filters.find((item) => item.field.toLowerCase() === field.toLowerCase()) ??
    null
  )
}

export function toFilterQueryParams(filters: ColumnFilterValue[]) {
  const serialized = filters
    .map(serializeColumnFilter)
    .filter((value): value is string => Boolean(value))
  return serialized.length > 0 ? serialized : undefined
}
