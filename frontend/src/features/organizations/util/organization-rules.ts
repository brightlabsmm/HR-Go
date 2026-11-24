/**
 * Checks whether an organization is eligible for deletion.
 * Under BUG-31, only never-activated (PENDING) organizations without active users/admins can be deleted.
 * Active or suspended organizations must be suspended/archived, not deleted.
 */
export function isDeletableOrganization(
  organization?: { status: string } | null,
  canDeletePermission = true
): boolean {
  if (!organization || !canDeletePermission) {
    return false
  }
  return organization.status === "PENDING"
}
