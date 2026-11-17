import { useCurrentUserQuery } from "@/shared/queries/auth.query"

export function usePermissions() {
  const { data: user, isPending } = useCurrentUserQuery()
  const permissions = user?.permissions ?? []

  function can(code: string) {
    return permissions.includes(code)
  }

  function canAll(codes: string[]) {
    return codes.every((code) => can(code))
  }

  return { can, canAll, user, isPending }
}
