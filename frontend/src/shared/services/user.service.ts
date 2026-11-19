import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { controlPath } from "@/app/api/paths"
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

export function listUsers(params?: UserListParams) {
  return unwrapPage<PlatformUser>(
    apiClient.get(controlPath("/users"), { params: toListQuery(params) })
  )
}

export function getUser(id: string) {
  return unwrap<PlatformUser>(apiClient.get(controlPath(`/users/${id}`)))
}

export function createUser(input: CreatePlatformUserInput) {
  return unwrap<PlatformUser>(apiClient.post(controlPath("/users"), input))
}

export function updateUser(id: string, input: UpdatePlatformUserInput) {
  return unwrap<PlatformUser>(
    apiClient.patch(controlPath(`/users/${id}`), input)
  )
}

export function replaceUserRoles(id: string, roleIds: string[]) {
  return unwrap<PlatformUser>(
    apiClient.put(controlPath(`/users/${id}/roles`), { roleIds })
  )
}

export function deactivateUser(id: string) {
  return unwrap<PlatformUser>(
    apiClient.post(controlPath(`/users/${id}/deactivate`))
  )
}

export function reactivateUser(id: string) {
  return unwrap<PlatformUser>(
    apiClient.post(controlPath(`/users/${id}/reactivate`))
  )
}
