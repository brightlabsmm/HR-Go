import { apiClient } from "@/app/api/client"
import { unwrap, unwrapEmpty } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"

export interface EmploymentContract {
  id: string
  organizationId: string
  employeeId: string
  contractType: string
  startDate: string
  endDate?: string | null
  contractStatus: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateContractInput {
  contractType: string
  startDate: string
  endDate?: string | null
  contractStatus?: string
  notes?: string | null
}

export interface EmployeeDocument {
  id: string
  organizationId: string
  employeeId: string
  documentType: string
  documentName: string
  fileReference: string
  expiryDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentInput {
  documentType: string
  documentName: string
  fileReference: string
  expiryDate?: string | null
}

export interface EmployeeServiceYear {
  id: string
  organizationId: string
  employeeId: string
  calculationDate: string
  serviceYears: number
  createdAt: string
}

export interface EmployeeExitRecord {
  id: string
  organizationId: string
  employeeId: string
  exitType: string
  effectiveDate: string
  reason?: string | null
  decisionStatus: string
  recordedAt: string
}

export interface RecordExitInput {
  exitType: string
  effectiveDate: string
  reason?: string | null
}

export interface EmployeeHistorySnapshot {
  id: string
  organizationId: string
  employeeId: string
  exitRecordId?: string | null
  employeeSnapshot: Record<string, unknown>
  profileSnapshot?: Record<string, unknown>
  snapshotReason: string
  snapshotAt: string
}

export async function listEmployeeContracts(employeeId: string) {
  const res = await unwrap<{ items: EmploymentContract[] }>(
    apiClient.get(workspacePath(`/employees/${employeeId}/contracts`))
  )
  return res.items ?? []
}

export function createEmployeeContract(
  employeeId: string,
  input: CreateContractInput
) {
  return unwrap<EmploymentContract>(
    apiClient.post(workspacePath(`/employees/${employeeId}/contracts`), input)
  )
}

export function deleteEmployeeContract(employeeId: string, contractId: string) {
  return unwrapEmpty(
    apiClient.delete(
      workspacePath(`/employees/${employeeId}/contracts/${contractId}`)
    )
  )
}

export async function listEmployeeDocuments(employeeId: string) {
  const res = await unwrap<{ items: EmployeeDocument[] }>(
    apiClient.get(workspacePath(`/employees/${employeeId}/documents`))
  )
  return res.items ?? []
}

export function createEmployeeDocument(
  employeeId: string,
  input: CreateDocumentInput
) {
  return unwrap<EmployeeDocument>(
    apiClient.post(workspacePath(`/employees/${employeeId}/documents`), input)
  )
}

export function deleteEmployeeDocument(employeeId: string, documentId: string) {
  return unwrapEmpty(
    apiClient.delete(
      workspacePath(`/employees/${employeeId}/documents/${documentId}`)
    )
  )
}

export async function listServiceYears(employeeId: string) {
  const res = await unwrap<{ items: EmployeeServiceYear[] }>(
    apiClient.get(workspacePath(`/employees/${employeeId}/service-years`))
  )
  return res.items ?? []
}

export function recalculateServiceYear(
  employeeId: string,
  calculationDate?: string
) {
  return unwrap<EmployeeServiceYear>(
    apiClient.post(
      workspacePath(`/employees/${employeeId}/service-years/recalculate`),
      calculationDate ? { calculationDate } : {}
    )
  )
}

export async function listExitRecords(employeeId: string) {
  const res = await unwrap<{ items: EmployeeExitRecord[] }>(
    apiClient.get(workspacePath(`/employees/${employeeId}/exits`))
  )
  return res.items ?? []
}

export function recordEmployeeExit(employeeId: string, input: RecordExitInput) {
  return unwrap<EmployeeExitRecord>(
    apiClient.post(workspacePath(`/employees/${employeeId}/exits`), input)
  )
}

export async function listEmployeeHistories(employeeId: string) {
  const res = await unwrap<{ items: EmployeeHistorySnapshot[] }>(
    apiClient.get(workspacePath(`/employees/${employeeId}/histories`))
  )
  return res.items ?? []
}
