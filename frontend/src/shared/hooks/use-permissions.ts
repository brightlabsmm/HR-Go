import { useCurrentUserQuery } from "@/shared/queries/auth.query"

export function usePermissions() {
  const { data: user } = useCurrentUserQuery()
  const permissions = user?.permissions ?? []

  function can(code: string) {
    return permissions.includes(code)
  }

  return { can, user }
}
