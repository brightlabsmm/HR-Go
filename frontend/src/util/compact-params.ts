type PrimitiveValue = string | number | boolean
type QueryValue = PrimitiveValue | null | undefined | PrimitiveValue[]

export function compactParams<T extends object>(params?: T) {
  if (!params) {
    return undefined
  }

  const next: Record<string, PrimitiveValue | PrimitiveValue[]> = {}

  for (const [key, value] of Object.entries(params as Record<string, QueryValue>)) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue
      }
      next[key] = value
      continue
    }

    next[key] = value
  }

  return Object.keys(next).length > 0 ? next : undefined
}
