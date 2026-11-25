import { useState } from "react"
import {
  CalculatorIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  UserXIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { notifyApiError } from "@/app/api/feedback"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useCreateContractMutation,
  useCreateDocumentMutation,
  useDeleteContractMutation,
  useDeleteDocumentMutation,
  useEmployeeContractsQuery,
  useEmployeeDocumentsQuery,
  useEmployeeHistoriesQuery,
  useExitRecordsQuery,
  useRecalculateServiceYearMutation,
  useRecordExitMutation,
  useServiceYearsQuery,
} from "@/shared/queries/lifecycle.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDate } from "@/util/format-date"

function todayLocalDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function EmployeeLifecycleSections({
  employeeId,
}: {
  employeeId: string
}) {
  const { i18n } = useTranslation()
  const { can } = usePermissions()
  const canUpdate = can("org.employee.update")
  const canDelete = can("org.employee.delete")

  const contractsQuery = useEmployeeContractsQuery(employeeId)
  const documentsQuery = useEmployeeDocumentsQuery(employeeId)
  const serviceYearsQuery = useServiceYearsQuery(employeeId)
  const exitsQuery = useExitRecordsQuery(employeeId)
  const historiesQuery = useEmployeeHistoriesQuery(employeeId)

  const createContractMut = useCreateContractMutation()
  const deleteContractMut = useDeleteContractMutation()
  const createDocMut = useCreateDocumentMutation()
  const deleteDocMut = useDeleteDocumentMutation()
  const recalcMut = useRecalculateServiceYearMutation()
  const recordExitMut = useRecordExitMutation()

  const [showContractDialog, setShowContractDialog] = useState(false)
  const [contractType, setContractType] = useState("PERMANENT")
  const [contractStart, setContractStart] = useState(() => todayLocalDate())
  const [contractEnd, setContractEnd] = useState("")
  const [contractNotes, setContractNotes] = useState("")

  const [showDocDialog, setShowDocDialog] = useState(false)
  const [docType, setDocType] = useState("NRC")
  const [docName, setDocName] = useState("")
  const [docRef, setDocRef] = useState("")
  const [docExpiry, setDocExpiry] = useState("")

  const [showExitDialog, setShowExitDialog] = useState(false)
  const [exitType, setExitType] = useState("RESIGNATION")
  const [exitDate, setExitDate] = useState(() => todayLocalDate())
  const [exitReason, setExitReason] = useState("")

  const contracts = contractsQuery.data ?? []
  const documents = documentsQuery.data ?? []
  const serviceYears = serviceYearsQuery.data ?? []
  const exits = exitsQuery.data ?? []
  const histories = historiesQuery.data ?? []

  return (
    <>
      {/* Employment Contracts */}
      <section className="border-t border-hair pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-body-2 font-semibold text-foreground">
            Employment Contracts
          </h2>
          {canUpdate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowContractDialog(true)}
            >
              <PlusIcon className="size-4" />
              Add Contract
            </Button>
          )}
        </div>
        {contracts.length === 0 ? (
          <p className="text-small-2 text-muted-foreground">
            No employment contracts recorded.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-hair">
            <table className="w-full text-small-2">
              <thead className="border-b border-hair bg-subtle text-left font-medium text-muted-foreground">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Status</th>
                  {canUpdate && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-subtle/40">
                    <td className="p-3 font-medium text-foreground">
                      {c.contractType}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(c.startDate, i18n.language)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {c.endDate ? formatDate(c.endDate, i18n.language) : "Open-ended"}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.contractStatus} />
                    </td>
                    {canUpdate && (
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            deleteContractMut.mutate(
                              { employeeId, contractId: c.id },
                              {
                                onSuccess: () => toast.success("Contract deleted."),
                                onError: (err) => notifyApiError(err),
                              }
                            )
                          }
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Employee Documents */}
      <section className="border-t border-hair pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-body-2 font-semibold text-foreground">
            Employee Documents
          </h2>
          {canUpdate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDocDialog(true)}
            >
              <FileTextIcon className="size-4" />
              Add Document
            </Button>
          )}
        </div>
        {documents.length === 0 ? (
          <p className="text-small-2 text-muted-foreground">
            No employee documents uploaded.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-hair">
            <table className="w-full text-small-2">
              <thead className="border-b border-hair bg-subtle text-left font-medium text-muted-foreground">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Document Name</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Expiry</th>
                  {canUpdate && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-subtle/40">
                    <td className="p-3">
                      <Badge variant="outline">{doc.documentType}</Badge>
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {doc.documentName}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {doc.fileReference}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {doc.expiryDate
                        ? formatDate(doc.expiryDate, i18n.language)
                        : "—"}
                    </td>
                    {canUpdate && (
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            deleteDocMut.mutate(
                              { employeeId, documentId: doc.id },
                              {
                                onSuccess: () => toast.success("Document removed."),
                                onError: (err) => notifyApiError(err),
                              }
                            )
                          }
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Service Years & Exit Records */}
      <section className="border-t border-hair pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-body-2 font-semibold text-foreground">
            Service Years & Exit History
          </h2>
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={recalcMut.isPending}
                onClick={() =>
                  recalcMut.mutate(
                    { employeeId },
                    {
                      onSuccess: () => toast.success("Service years calculated."),
                      onError: (err) => notifyApiError(err),
                    }
                  )
                }
              >
                <CalculatorIcon className="size-4" />
                Calculate Service Years
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setShowExitDialog(true)}
              >
                <UserXIcon className="size-4" />
                Record Exit
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-hair p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Service Year Snapshots
            </h3>
            {serviceYears.length === 0 ? (
              <p className="text-small-2 text-muted-foreground">No calculations yet.</p>
            ) : (
              <ul className="space-y-1.5 text-small-2">
                {serviceYears.map((sy) => (
                  <li key={sy.id} className="flex justify-between">
                    <span>{formatDate(sy.calculationDate, i18n.language)}</span>
                    <span className="font-semibold text-foreground">
                      {sy.serviceYears} yrs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-md border border-hair p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Exit & Offboarding Snapshots
            </h3>
            {exits.length === 0 && histories.length === 0 ? (
              <p className="text-small-2 text-muted-foreground">Active employment — no exit records.</p>
            ) : (
              <ul className="space-y-2 text-small-2">
                {exits.map((ex) => (
                  <li key={ex.id} className="flex items-center justify-between gap-2">
                    <div>
                      <Badge variant="secondary">{ex.exitType}</Badge>{" "}
                      <span className="text-muted-foreground">
                        {formatDate(ex.effectiveDate, i18n.language)}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {ex.reason || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Contract Dialog */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employment Contract</DialogTitle>
            <DialogDescription>Record contract type and effective period.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label>Contract Type</Label>
              <Select value={contractType} onValueChange={(v) => setContractType(v ?? "PERMANENT")}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="FIXED_TERM">Fixed Term</SelectItem>
                  <SelectItem value="PROBATION">Probation</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" className="mt-1" value={contractStart} onChange={(e) => setContractStart(e.target.value)} />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input type="date" className="mt-1" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" value={contractNotes} onChange={(e) => setContractNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>Cancel</Button>
            <Button
              loading={createContractMut.isPending}
              disabled={!contractStart || (Boolean(contractEnd) && contractEnd < contractStart)}
              onClick={() =>
                createContractMut.mutate(
                  {
                    employeeId,
                    input: {
                      contractType,
                      startDate: contractStart,
                      endDate: contractEnd || null,
                      notes: contractNotes.trim() || null,
                    },
                  },
                  {
                    onSuccess: () => {
                      setShowContractDialog(false)
                      toast.success("Contract created.")
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              Save Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Document</DialogTitle>
            <DialogDescription>Store document metadata and reference URL/path.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v ?? "NRC")}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NRC">National ID / NRC</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="CONTRACT">Signed Contract</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Name</Label>
              <Input className="mt-1" value={docName} onChange={(e) => setDocName(e.target.value)} />
            </div>
            <div>
              <Label>File Reference / URL</Label>
              <Input className="mt-1" value={docRef} onChange={(e) => setDocRef(e.target.value)} />
            </div>
            <div>
              <Label>Expiry Date (Optional)</Label>
              <Input type="date" className="mt-1" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocDialog(false)}>Cancel</Button>
            <Button
              loading={createDocMut.isPending}
              disabled={!docName.trim() || !docRef.trim()}
              onClick={() =>
                createDocMut.mutate(
                  {
                    employeeId,
                    input: {
                      documentType: docType,
                      documentName: docName.trim(),
                      fileReference: docRef.trim(),
                      expiryDate: docExpiry || null,
                    },
                  },
                  {
                    onSuccess: () => {
                      setShowDocDialog(false)
                      setDocName("")
                      setDocRef("")
                      setDocExpiry("")
                      toast.success("Document saved.")
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              Save Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Record Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Employee Exit</DialogTitle>
            <DialogDescription>
              Captures an immutable employee snapshot, revokes active sessions, and transitions employment status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label>Exit Type</Label>
              <Select value={exitType} onValueChange={(v) => setExitType(v ?? "RESIGNATION")}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIGNATION">Resignation</SelectItem>
                  <SelectItem value="TERMINATION">Termination</SelectItem>
                  <SelectItem value="RETIREMENT">Retirement</SelectItem>
                  <SelectItem value="END_OF_CONTRACT">End of Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input type="date" className="mt-1" value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea className="mt-1" value={exitReason} onChange={(e) => setExitReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={recordExitMut.isPending}
              disabled={!exitDate}
              onClick={() =>
                recordExitMut.mutate(
                  {
                    employeeId,
                    input: {
                      exitType,
                      effectiveDate: exitDate,
                      reason: exitReason.trim() || null,
                    },
                  },
                  {
                    onSuccess: () => {
                      setShowExitDialog(false)
                      toast.success("Employee exit recorded and account deactivated.")
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              Confirm Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
