import { useCurrentUserQuery } from "@/shared/queries/auth.query"

export function hasPermission(
  permissions: readonly string[],
  code: string
): boolean {
  if (permissions.includes("platform.all") || permissions.includes("org.all")) {
    return true
  }
  return permissions.includes(code)
}

export function usePermissions() {
  const { data: user, isPending } = useCurrentUserQuery()
  const permissions = user?.permissions ?? []

  function can(code: string) {
    return hasPermission(permissions, code)
  }

  function canAll(codes: string[]) {
    return codes.every((code) => can(code))
  }

  return { can, canAll, user, isPending }
}
