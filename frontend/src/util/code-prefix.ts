export function stripCodePrefix(prefix: string, value: string) {
  const trimmed = value.trim()
  if (trimmed.toUpperCase().startsWith(prefix.toUpperCase())) {
    return trimmed.slice(prefix.length)
  }

  return trimmed
}

export function joinCodePrefix(prefix: string, value: string) {
  const rest = stripCodePrefix(prefix, value)
  return rest ? `${prefix}${rest}` : rest
}
