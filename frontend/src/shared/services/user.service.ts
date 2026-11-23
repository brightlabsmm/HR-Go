import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { controlPath, workspacePath } from "@/app/api/paths"
import { isPlatformPortal } from "@/app/portal"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

import type { AuthRole } from "@/shared/services/auth.service"

export type PlatformUserStatus = "ACTIVE" | "INACTIVE"

export interface PlatformUser {
  id: string
  fullName: string
  email: string
  status: PlatformUserStatus | string
  lastLoginAt?: string | null
  roles: AuthRole[]
  permissions: string[]
}

export type UserListParams = ListQueryParams

export interface CreatePlatformUserInput {
  fullName: string
  email: string
  password: string
  roleIds?: string[]
}

export interface UpdatePlatformUserInput {
  fullName?: string
  email?: string
}

function usersPath(path = "") {
  return isPlatformPortal() ? controlPath(`/users${path}`) : workspacePath(`/users${path}`)
}

export function listUsers(params?: UserListParams) {
  return unwrapPage<PlatformUser>(
    apiClient.get(usersPath(), { params: toListQuery(params) })
  )
}

export function getUser(id: string) {
  return unwrap<PlatformUser>(apiClient.get(usersPath(`/${id}`)))
}

export function createUser(input: CreatePlatformUserInput) {
  return unwrap<PlatformUser>(apiClient.post(usersPath(), input))
}

export function updateUser(id: string, input: UpdatePlatformUserInput) {
  return unwrap<PlatformUser>(
    apiClient.patch(usersPath(`/${id}`), input)
  )
}

export function replaceUserRoles(id: string, roleIds: string[]) {
  return unwrap<PlatformUser>(
    apiClient.put(usersPath(`/${id}/roles`), { roleIds })
  )
}

export function deactivateUser(id: string) {
  return unwrap<PlatformUser>(
    apiClient.post(usersPath(`/${id}/deactivate`))
  )
}

export function reactivateUser(id: string) {
  return unwrap<PlatformUser>(
    apiClient.post(usersPath(`/${id}/reactivate`))
  )
}
