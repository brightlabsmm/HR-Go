export function getInitials(...parts: (string | null | undefined)[]) {
  const letters = parts
    .map((part) => (part ?? "").trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")

  return letters.toUpperCase() || "?"
}
