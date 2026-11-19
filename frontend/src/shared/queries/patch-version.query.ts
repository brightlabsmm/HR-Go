import { useQuery } from "@tanstack/react-query"

import { getCurrentPatchVersion } from "@/shared/services/patch-version.service"

export const patchVersionKeys = {
  all: ["patch-version"] as const,
  current: () => [...patchVersionKeys.all, "current"] as const,
}

export function useCurrentPatchVersionQuery() {
  return useQuery({
    queryKey: patchVersionKeys.current(),
    queryFn: getCurrentPatchVersion,
    meta: { skipErrorToast: true },
    staleTime: 60_000,
  })
}
