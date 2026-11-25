import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { employeeKeys } from "@/shared/queries/employee.query"
import {
  createEmployeeContract,
  createEmployeeDocument,
  deleteEmployeeContract,
  deleteEmployeeDocument,
  listEmployeeContracts,
  listEmployeeDocuments,
  listEmployeeHistories,
  listExitRecords,
  listServiceYears,
  recalculateServiceYear,
  recordEmployeeExit,
  type CreateContractInput,
  type CreateDocumentInput,
  type RecordExitInput,
} from "@/shared/services/lifecycle.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const lifecycleKeys = {
  contracts: (empId: string) => ["employee-contracts", empId] as const,
  documents: (empId: string) => ["employee-documents", empId] as const,
  serviceYears: (empId: string) => ["employee-service-years", empId] as const,
  exits: (empId: string) => ["employee-exits", empId] as const,
  histories: (empId: string) => ["employee-histories", empId] as const,
}

export function useEmployeeContractsQuery(employeeId: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: lifecycleKeys.contracts(employeeId),
    queryFn: () => listEmployeeContracts(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useCreateContractMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      input,
    }: {
      employeeId: string
      input: CreateContractInput
    }) => createEmployeeContract(employeeId, input),
    onSuccess: (_, { employeeId }) => {
      void qc.invalidateQueries({ queryKey: lifecycleKeys.contracts(employeeId) })
    },
  })
}

export function useDeleteContractMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      contractId,
    }: {
      employeeId: string
      contractId: string
    }) => deleteEmployeeContract(employeeId, contractId),
    onSuccess: (_, { employeeId }) => {
      void qc.invalidateQueries({ queryKey: lifecycleKeys.contracts(employeeId) })
    },
  })
}

export function useEmployeeDocumentsQuery(employeeId: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: lifecycleKeys.documents(employeeId),
    queryFn: () => listEmployeeDocuments(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useCreateDocumentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      input,
    }: {
      employeeId: string
      input: CreateDocumentInput
    }) => createEmployeeDocument(employeeId, input),
    onSuccess: (_, { employeeId }) => {
      void qc.invalidateQueries({ queryKey: lifecycleKeys.documents(employeeId) })
    },
  })
}

export function useDeleteDocumentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      documentId,
    }: {
      employeeId: string
      documentId: string
    }) => deleteEmployeeDocument(employeeId, documentId),
    onSuccess: (_, { employeeId }) => {
      void qc.invalidateQueries({ queryKey: lifecycleKeys.documents(employeeId) })
    },
  })
}

export function useServiceYearsQuery(employeeId: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: lifecycleKeys.serviceYears(employeeId),
    queryFn: () => listServiceYears(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useRecalculateServiceYearMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      calculationDate,
    }: {
      employeeId: string
      calculationDate?: string
    }) => recalculateServiceYear(employeeId, calculationDate),
    onSuccess: (_, { employeeId }) => {
      void qc.invalidateQueries({
        queryKey: lifecycleKeys.serviceYears(employeeId),
      })
    },
  })
}

export function useExitRecordsQuery(employeeId: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: lifecycleKeys.exits(employeeId),
    queryFn: () => listExitRecords(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useEmployeeHistoriesQuery(employeeId: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: lifecycleKeys.histories(employeeId),
    queryFn: () => listEmployeeHistories(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useRecordExitMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      input,
    }: {
      employeeId: string
      input: RecordExitInput
    }) => recordEmployeeExit(employeeId, input),
    onSuccess: (_, { employeeId }) => {
      void qc.invalidateQueries({ queryKey: lifecycleKeys.exits(employeeId) })
      void qc.invalidateQueries({ queryKey: lifecycleKeys.histories(employeeId) })
      void qc.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) })
      void qc.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
