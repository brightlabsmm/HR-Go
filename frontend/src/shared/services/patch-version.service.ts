import { apiClient } from "@/app/api/client"
import { unwrap } from "@/app/api/http"

export interface PatchVersion {
  patchVersion: string
  patchDateTime: string
  current: boolean
}

export function getCurrentPatchVersion() {
  return unwrap<PatchVersion>(apiClient.get("/patch-version"))
}
