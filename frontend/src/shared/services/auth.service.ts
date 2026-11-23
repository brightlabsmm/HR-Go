import { isPlatformPortal } from "@/app/portal"
import { apiClient } from "@/app/api/client"
import { unwrap, unwrapEmpty } from "@/app/api/http"
import { portalAuthPath } from "@/app/api/paths"

export interface AuthRole {
  roleCode: string
  roleName: string
  branchId?: string | null
  departmentId?: string | null
}

export interface AuthProfile {
  id: string
  fullName: string
  email?: string | null
  employeeCode?: string
  organizationId?: string
  organizationName?: string
  status: string
  roles: AuthRole[]
  permissions: string[]
  mustChangePassword?: boolean
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthProfile
}

export interface LoginInput {
  email?: string
  identifier?: string
  password: string
}

interface PlatformUserPayload {
  id: string
  fullName: string
  email?: string | null
  status?: string
  roles?: AuthRole[]
  permissions?: string[]
}

interface WorkspaceUserPayload {
  organizationId?: string
  organizationName?: string
  accountId: string
  employeeId?: string
  employeeCode?: string
  fullName: string
  accountStatus?: string
  roles?: AuthRole[]
  permissions?: string[]
  mustChangePassword?: boolean
}

interface LoginPayload {
  accessToken: string
  tokenType?: string
  expiresIn?: number
  mustChangePassword?: boolean
  user: PlatformUserPayload | WorkspaceUserPayload
}

function mapPlatformUser(user: PlatformUserPayload): AuthProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    status: user.status ?? "ACTIVE",
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
  }
}

function mapWorkspaceUser(user: WorkspaceUserPayload): AuthProfile {
  return {
    id: user.accountId,
    fullName: user.fullName,
    employeeCode: user.employeeCode,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    status: user.accountStatus ?? "ACTIVE",
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
    mustChangePassword: Boolean(user.mustChangePassword),
  }
}

function mapProfile(payload: PlatformUserPayload | WorkspaceUserPayload): AuthProfile {
  if ("accountId" in payload) {
    return mapWorkspaceUser(payload)
  }

  return mapPlatformUser(payload)
}

export function login(input: LoginInput) {
  const body = isPlatformPortal()
    ? { email: input.email, password: input.password }
    : { identifier: input.identifier, password: input.password }

  return unwrap<LoginPayload>(apiClient.post(portalAuthPath("/login"), body)).then(
    (payload) => {
      const profile = mapProfile(payload.user)
      if (payload.mustChangePassword !== undefined) {
        profile.mustChangePassword = payload.mustChangePassword
      }
      return {
        accessToken: payload.accessToken,
        tokenType: payload.tokenType ?? "Bearer",
        expiresIn: payload.expiresIn ?? 0,
        user: profile,
      }
    }
  )
}

export function logout() {
  return unwrapEmpty(apiClient.post(portalAuthPath("/logout")))
}

export function getCurrentUser() {
  return unwrap<PlatformUserPayload | WorkspaceUserPayload>(
    apiClient.get(portalAuthPath("/me"))
  ).then(mapProfile)
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function changePassword(input: ChangePasswordInput) {
  return unwrap<{ message: string }>(
    apiClient.post(portalAuthPath("/change-password"), input)
  )
}
