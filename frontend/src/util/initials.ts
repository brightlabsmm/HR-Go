export function getInitials(...parts: (string | null | undefined)[]) {
  const letters = parts
    .map((part) => {
      const match = (part ?? "").trim().match(/[\p{L}\p{N}]/u)
      return match ? match[0] : ""
    })
    .filter(Boolean)
    .slice(0, 2)
    .join("")

  return letters.toUpperCase() || "?"
}
