type QueryValue = string | number | boolean | null | undefined

export function compactParams<T extends object>(params?: T) {
  if (!params) {
    return undefined
  }

  const next: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(params as Record<string, QueryValue>)) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    next[key] = value
  }

  return Object.keys(next).length > 0 ? next : undefined
}
