/**
 * Returns a set of branch IDs that are descendants (children, grandchildren, etc.) of the target branch.
 */
export function getDescendantBranchIds(
  branchId: string,
  branches: Array<{ id: string; parentId?: string | null }>
): Set<string> {
  const descendantIds = new Set<string>()
  const queue = [branchId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    for (const b of branches) {
      if (b.parentId === currentId && !descendantIds.has(b.id)) {
        descendantIds.add(b.id)
        queue.push(b.id)
      }
    }
  }

  return descendantIds
}
