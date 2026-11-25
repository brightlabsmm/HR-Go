import { apiClient } from "@/app/api/client"
import { unwrap, unwrapEmpty, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

export type EmploymentStatus =
  | "ACTIVE"
  | "PROBATION"
  | "SUSPENDED"
  | "TERMINATED"
  | "RESIGNED"

export type Gender = "MALE" | "FEMALE" | "OTHER"
export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "OTHER"

export interface EmployeeProfile {
  dateOfBirth?: string
  gender?: Gender | string
  nationality?: string
  maritalStatus?: MaritalStatus | string
  address?: string
  emergencyContact?: string
}

export interface Employee {
  id: string
  organizationId: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  email?: string | null
  phone?: string | null
  branchId?: string | null
  branchName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  positionId?: string | null
  positionTitle?: string | null
  dateOfJoining?: string | null
  employmentStatus: EmploymentStatus | string
  profile?: EmployeeProfile | null
  createdAt: string
  updatedAt: string
}

export interface PositionHistory {
  id: string
  employeeId: string
  oldPositionId?: string | null
  oldPositionTitle?: string | null
  newPositionId: string
  newPositionTitle: string
  effectiveDate: string
  remarks?: string | null
  createdAt: string
}

export interface EmployeeListParams extends ListQueryParams {
  branchId?: string
  departmentId?: string
  positionId?: string
}

export interface CreateEmployeeInput {
  employeeCode: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  branchId?: string | null
  departmentId?: string | null
  positionId?: string | null
  dateOfJoining?: string | null
  employmentStatus?: EmploymentStatus | string
  dateOfBirth?: string | null
  gender?: Gender | string | null
  nationality?: string | null
  maritalStatus?: MaritalStatus | string | null
  address?: string | null
  emergencyContact?: string | null
}

export interface UpdateEmployeeInput {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  branchId?: string | null
  departmentId?: string | null
  positionId?: string | null
  dateOfJoining?: string | null
  employmentStatus?: EmploymentStatus | string
  dateOfBirth?: string | null
  gender?: Gender | string | null
  nationality?: string | null
  maritalStatus?: MaritalStatus | string | null
  address?: string | null
  emergencyContact?: string | null
}

export interface ChangePositionInput {
  newPositionId: string
  effectiveDate: string
  remarks?: string | null
}

export function listEmployees(params?: EmployeeListParams) {
  return unwrapPage<Employee>(
    apiClient.get(workspacePath("/employees"), {
      params: toListQuery(params),
    })
  )
}

export function getEmployee(id: string) {
  return unwrap<Employee>(
    apiClient.get(workspacePath(`/employees/${id}`))
  )
}

export function createEmployee(input: CreateEmployeeInput) {
  return unwrap<Employee>(
    apiClient.post(workspacePath("/employees"), compactParams(input))
  )
}

export function updateEmployee(id: string, input: UpdateEmployeeInput) {
  return unwrap<Employee>(
    apiClient.put(workspacePath(`/employees/${id}`), compactParams(input))
  )
}

export function deleteEmployee(id: string) {
  return unwrapEmpty(
    apiClient.delete(workspacePath(`/employees/${id}`))
  )
}

export function getPositionHistory(employeeId: string) {
  return unwrap<PositionHistory[]>(
    apiClient.get(workspacePath(`/employees/${employeeId}/position-history`))
  )
}

export function changePosition(employeeId: string, input: ChangePositionInput) {
  return unwrap<PositionHistory>(
    apiClient.post(
      workspacePath(`/employees/${employeeId}/position-history`),
      compactParams(input)
    )
  )
}
