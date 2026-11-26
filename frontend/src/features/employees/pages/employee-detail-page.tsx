import { useState } from "react"
import { CalendarIcon, PencilIcon, Trash2Icon, UserCheckIcon, CheckCircleIcon, ShieldOffIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailActionButton } from "@/components/common/detail-action-button"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { PageHeader } from "@/components/common/page-header"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
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
import { EmployeeLifecycleSections } from "@/features/employees/components/employee-lifecycle-sections"
import { useCurrentUserQuery } from "@/shared/queries/auth.query"
import {
  useChangePositionMutation,
  useDeleteEmployeeMutation,
  useEmployeeQuery,
  usePositionHistoryQuery,
} from "@/shared/queries/employee.query"
import { usePositionsQuery } from "@/shared/queries/position.query"
import {
  useAssignShiftMutation,
  useEmployeeShiftAssignmentsQuery,
  useShiftsQuery,
} from "@/shared/queries/shift.query"
import {
  useDeactivateUserMutation,
  useReactivateUserMutation,
} from "@/shared/queries/user.query"
import { toast } from "@/shared/stores/toast.store"
import { notifyApiError } from "@/app/api/feedback"
import { formatDate, formatDateTime, formatLocalDateInput } from "@/util/format-date"
import { getInitials } from "@/util/initials"

export function EmployeeDetailPage() {
  const { t, i18n } = useTranslation("employees")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()

  const employeeQuery = useEmployeeQuery(id)
  const employee = employeeQuery.data
  const meQuery = useCurrentUserQuery()

  const positionHistoryQuery = usePositionHistoryQuery(id)
  const shiftAssignmentsQuery = useEmployeeShiftAssignmentsQuery(id)
  const positionsQuery = usePositionsQuery({ status: "active", limit: 100 })
  const shiftsQuery = useShiftsQuery({ status: "active", limit: 100 })

  const { can } = usePermissions()
  const canUpdate = can("org.employee.update")
  const canDelete = can("org.employee.delete")
  const canAssignShift = can("org.shift.assign")
  const canManageAccount = can("org.user.deactivate") || can("org.role.assign")

  const deleteMutation = useDeleteEmployeeMutation()
  const changePositionMutation = useChangePositionMutation()
  const assignShiftMutation = useAssignShiftMutation()
  const deactivateAccountMutation = useDeactivateUserMutation()
  const reactivateAccountMutation = useReactivateUserMutation()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPositionDialog, setShowPositionDialog] = useState(false)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showDeactivateAccountDialog, setShowDeactivateAccountDialog] =
    useState(false)
  const [showReactivateAccountDialog, setShowReactivateAccountDialog] =
    useState(false)

  const isSelfAccount = Boolean(
    employee?.accountId && meQuery.data?.id === employee.accountId
  )
  const isAccountInactive =
    (employee?.accountStatus ?? "").toUpperCase() === "INACTIVE"

  // Position change state
  const [newPositionId, setNewPositionId] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [positionRemarks, setPositionRemarks] = useState("")

  // Shift assignment state
  const [newShiftId, setNewShiftId] = useState("")
  const [shiftEffectiveFrom, setShiftEffectiveFrom] = useState("")
  const [shiftEffectiveTo, setShiftEffectiveTo] = useState("")
  const [shiftReason, setShiftReason] = useState("")
  const shiftDateOrderError = Boolean(
    shiftEffectiveTo && shiftEffectiveFrom && shiftEffectiveTo < shiftEffectiveFrom
  )

  if (!employee && employeeQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/employees"
        backLabel={t("title")}
        description={t("not_found")}
      />
    )
  }

  const name = employee?.fullName ?? ""

  const employmentItems = [
    { label: t("columns.code"), value: employee?.employeeCode, mono: true },
    { label: t("form.email"), value: employee?.email || "—" },
    { label: t("form.phone"), value: employee?.phone || "—" },
    {
      label: t("columns.branch"),
      value: employee?.branchId ? (
        <Link
          to={`/branches/${employee.branchId}`}
          className="text-primary hover:underline"
        >
          {employee.branchName || employee.branchId}
        </Link>
      ) : (
        employee?.branchName || "—"
      ),
    },
    {
      label: t("columns.department"),
      value: employee?.departmentId ? (
        <Link
          to={`/departments/${employee.departmentId}`}
          className="text-primary hover:underline"
        >
          {employee.departmentName || employee.departmentId}
        </Link>
      ) : (
        employee?.departmentName || "—"
      ),
    },
    {
      label: t("columns.position"),
      value: employee?.positionId ? (
        <Link
          to={`/positions/${employee.positionId}`}
          className="text-primary hover:underline"
        >
          {employee.positionTitle || employee.positionId}
        </Link>
      ) : (
        employee?.positionTitle || "—"
      ),
    },
    { label: t("form.role", { defaultValue: "Role" }), value: employee?.roleName || "—" },
    {
      label: t("columns.joined"),
      value: employee?.dateOfJoining
        ? formatDate(employee.dateOfJoining, i18n.language)
        : "—",
    },
    {
      label: tCommon("created_at", "Created"),
      value: employee ? formatDate(employee.createdAt, i18n.language) : null,
    },
  ]

  const personalItems = [
    {
      label: t("form.date_of_birth"),
      value: employee?.profile?.dateOfBirth
        ? formatDate(employee.profile.dateOfBirth, i18n.language)
        : "—",
    },
    { label: t("form.gender"), value: employee?.profile?.gender ? t(`gender.${employee.profile.gender}`, { defaultValue: employee.profile.gender }) : "—" },
    {
      label: t("form.nationality"),
      value: employee?.profile?.nationality || "—",
    },
    {
      label: t("form.marital_status"),
      value: employee?.profile?.maritalStatus ? t(`marital_status.${employee.profile.maritalStatus}`, { defaultValue: employee.profile.maritalStatus }) : "—",
    },
    {
      label: t("form.emergency_contact"),
      value: employee?.profile?.emergencyContact || "—",
    },
    {
      label: t("form.address"),
      value: employee?.profile?.address || "—",
    },
  ]

  const accessItems = [
    {
      label: t("form.role"),
      value: employee?.roleName || "—",
    },
    {
      label: t("columns.account_status"),
      value: employee?.accountStatus ? (
        <StatusBadge status={employee.accountStatus} />
      ) : (
        "—"
      ),
    },
    {
      label: t("columns.last_login_at"),
      value: employee?.lastLoginAt
        ? formatDateTime(employee.lastLoginAt, i18n.language)
        : "—",
    },
  ]

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {canUpdate && employee && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewPositionId(employee.positionId ?? "")
              setEffectiveDate(formatLocalDateInput(new Date()))
              setPositionRemarks("")
              setShowPositionDialog(true)
            }}
          >
            <UserCheckIcon className="size-4" />
            {t("change_position.button")}
          </Button>
          <DetailActionButton onClick={() => void navigate(`/employees/${id}/edit`)}>
            <PencilIcon />
            {tCommon("actions.edit")}
          </DetailActionButton>
        </>
      )}
      {canAssignShift && employee && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewShiftId("")
            setShiftEffectiveFrom(formatLocalDateInput(new Date()))
            setShiftEffectiveTo("")
            setShiftReason("")
            setShowShiftDialog(true)
          }}
        >
          <CalendarIcon className="size-4" />
          {t("assign_shift.button")}
        </Button>
      )}
      {canManageAccount && employee?.accountId && !isSelfAccount && isAccountInactive && (
        <DetailActionButton
          tone="success"
          loading={reactivateAccountMutation.isPending}
          onClick={() => setShowReactivateAccountDialog(true)}
        >
          <CheckCircleIcon />
          {t("account.reactivate")}
        </DetailActionButton>
      )}
      {canManageAccount && employee?.accountId && !isSelfAccount && !isAccountInactive && (
        <DetailActionButton
          tone="destructive"
          loading={deactivateAccountMutation.isPending}
          onClick={() => setShowDeactivateAccountDialog(true)}
        >
          <ShieldOffIcon />
          {t("account.deactivate")}
        </DetailActionButton>
      )}
      {canDelete && employee && (
        <DetailActionButton
          tone="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2Icon />
          {tCommon("actions.delete")}
        </DetailActionButton>
      )}
    </div>
  )

  const positionHistoryList = positionHistoryQuery.data ?? []
  const shiftAssignmentsList = shiftAssignmentsQuery.data ?? []

  return (
    <MotionStack className="flex flex-col gap-8 pb-4">
      <PageHeader
        backTo="/employees"
        backLabel={t("title")}
        title={name || t("title")}
        description={employee?.employeeCode}
        actions={actions}
      />

      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={employeeQuery.isPending}
          avatarSize="xl"
          title={name}
          subtitle={employee?.positionTitle || employee?.employeeCode}
          initials={getInitials(employee?.firstName, employee?.lastName)}
          badges={
            employee ? <StatusBadge status={employee.employmentStatus} /> : null
          }
        />

        <div className="flex min-w-0 flex-col gap-8">
          {employeeQuery.isPending ? (
            <FormSkeleton fields={6} columns={2} />
          ) : (
            <>
              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.basic")}
                </h2>
                <DetailList columns={2} items={employmentItems} />
              </section>

              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.personal")}
                </h2>
                <DetailList columns={2} items={personalItems} />
              </section>

              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.access")}
                </h2>
                <DetailList columns={2} items={accessItems} />
              </section>

              <section className="border-t border-hair pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-body-2 font-semibold text-foreground">
                    {t("sections.position_history")}
                  </h2>
                </div>
                {positionHistoryList.length === 0 ? (
                  <p className="text-small-2 text-muted-foreground">
                    {t("history.empty")}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-hair">
                    <table className="w-full text-small-2">
                      <thead className="bg-subtle border-b border-hair text-left font-medium text-muted-foreground">
                        <tr>
                          <th className="p-3">{t("history.old_position")}</th>
                          <th className="p-3">{t("history.new_position")}</th>
                          <th className="p-3">{t("history.effective_date")}</th>
                          <th className="p-3">{t("history.remarks")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hair">
                        {positionHistoryList.map((hist) => (
                          <tr key={hist.id} className="hover:bg-subtle/50">
                            <td className="p-3 text-muted-foreground">
                              {hist.oldPositionTitle || t("history.initial")}
                            </td>
                            <td className="p-3 font-medium text-foreground">
                              {hist.newPositionTitle}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {formatDate(hist.effectiveDate, i18n.language)}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {hist.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="border-t border-hair pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-body-2 font-semibold text-foreground">
                    {t("sections.shift_assignments")}
                  </h2>
                </div>
                {shiftAssignmentsList.length === 0 ? (
                  <p className="text-small-2 text-muted-foreground">
                    {t("shifts.empty")}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-hair">
                    <table className="w-full text-small-2">
                      <thead className="bg-subtle border-b border-hair text-left font-medium text-muted-foreground">
                        <tr>
                          <th className="p-3">{t("shifts.shift")}</th>
                          <th className="p-3">{t("shifts.working_hours")}</th>
                          <th className="p-3">{t("shifts.effective_from")}</th>
                          <th className="p-3">{t("shifts.effective_to")}</th>
                          <th className="p-3">{t("shifts.status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hair">
                        {shiftAssignmentsList.map((sa) => (
                          <tr key={sa.id} className="hover:bg-subtle/50">
                            <td className="p-3 font-medium text-foreground">
                              {sa.shiftName}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {sa.startTime} - {sa.endTime}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {formatDate(sa.effectiveFrom, i18n.language)}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {sa.effectiveTo
                                ? formatDate(sa.effectiveTo, i18n.language)
                                : t("shifts.ongoing")}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={sa.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
          {employee && <EmployeeLifecycleSections employeeId={employee.id} />}
        </div>
      </div>

      {/* Position Change Dialog */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("change_position.title")}</DialogTitle>
            <DialogDescription>
              {t("change_position.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label htmlFor="pos-select">{t("change_position.new_position")}</Label>
              <Select
                items={(positionsQuery.data?.items ?? []).map((p) => ({
                  value: p.id,
                  label: `${p.positionName} (${p.positionCode})`,
                }))}
                value={newPositionId}
                onValueChange={(val) => setNewPositionId(val ?? "")}
              >
                <SelectTrigger id="pos-select" className="mt-1 w-full">
                  <SelectValue placeholder={t("change_position.position_placeholder")}>
                    {positionsQuery.data?.items?.find((p) => p.id === newPositionId)
                      ? `${positionsQuery.data.items.find((p) => p.id === newPositionId)!.positionName} (${positionsQuery.data.items.find((p) => p.id === newPositionId)!.positionCode})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(positionsQuery.data?.items ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.positionName} ({p.positionCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pos-date">{t("change_position.effective_date")}</Label>
              <Input
                id="pos-date"
                type="date"
                className="mt-1"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pos-remarks">{t("change_position.remarks")}</Label>
              <Textarea
                id="pos-remarks"
                className="mt-1"
                placeholder={t("change_position.remarks_placeholder")}
                value={positionRemarks}
                onChange={(e) => setPositionRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPositionDialog(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button
              loading={changePositionMutation.isPending}
              disabled={!newPositionId || !effectiveDate}
              onClick={() => {
                changePositionMutation.mutate(
                  {
                    employeeId: id,
                    input: {
                      newPositionId,
                      effectiveDate,
                      remarks: positionRemarks.trim() || null,
                    },
                  },
                  {
                    onSuccess: () => {
                      setShowPositionDialog(false)
                      toast.success(t("change_position.success"))
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }}
            >
              {t("change_position.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Shift Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assign_shift.title")}</DialogTitle>
            <DialogDescription>
              {t("assign_shift.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label htmlFor="shift-select">{t("assign_shift.shift")}</Label>
              <Select
                items={(shiftsQuery.data?.items ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.shiftName} (${s.startTime} - ${s.endTime})`,
                }))}
                value={newShiftId}
                onValueChange={(val) => setNewShiftId(val ?? "")}
              >
                <SelectTrigger id="shift-select" className="mt-1 w-full">
                  <SelectValue placeholder={t("assign_shift.shift_placeholder")}>
                    {shiftsQuery.data?.items?.find((s) => s.id === newShiftId)
                      ? `${shiftsQuery.data.items.find((s) => s.id === newShiftId)!.shiftName} (${shiftsQuery.data.items.find((s) => s.id === newShiftId)!.startTime} - ${shiftsQuery.data.items.find((s) => s.id === newShiftId)!.endTime})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(shiftsQuery.data?.items ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shiftName} ({s.startTime} - {s.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shift-from">{t("assign_shift.effective_from")}</Label>
              <Input
                id="shift-from"
                type="date"
                className="mt-1"
                value={shiftEffectiveFrom}
                onChange={(e) => setShiftEffectiveFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="shift-to">{t("assign_shift.effective_to")}</Label>
              <Input
                id="shift-to"
                type="date"
                className="mt-1"
                value={shiftEffectiveTo}
                onChange={(e) => setShiftEffectiveTo(e.target.value)}
              />
              {shiftDateOrderError && (
                <p className="mt-1 text-xs text-destructive">
                  {t("assign_shift.errors.effective_to_order")}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="shift-reason">{t("assign_shift.reason")}</Label>
              <Input
                id="shift-reason"
                className="mt-1"
                placeholder={t("assign_shift.reason_placeholder")}
                value={shiftReason}
                onChange={(e) => setShiftReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShiftDialog(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button
              loading={assignShiftMutation.isPending}
              disabled={!newShiftId || !shiftEffectiveFrom || shiftDateOrderError}
              onClick={() => {
                if (shiftDateOrderError) return
                assignShiftMutation.mutate(
                  {
                    employeeId: id,
                    shiftId: newShiftId,
                    effectiveFrom: shiftEffectiveFrom,
                    effectiveTo: shiftEffectiveTo || null,
                    reason: shiftReason.trim() || null,
                  },
                  {
                    onSuccess: () => {
                      setShowShiftDialog(false)
                      toast.success(t("assign_shift.success"))
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }}
            >
              {t("assign_shift.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Reactivate Account Dialogs */}
      <ConfirmDialog
        open={showDeactivateAccountDialog}
        title={t("account.deactivate_title", { name })}
        description={t("account.deactivate_description", { name })}
        confirmLabel={t("account.deactivate_confirm")}
        confirmVariant="destructive"
        isPending={deactivateAccountMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setShowDeactivateAccountDialog(false)
        }}
        onConfirm={() => {
          if (!employee?.accountId) return
          deactivateAccountMutation.mutate(employee.accountId, {
            onSuccess: () => {
              setShowDeactivateAccountDialog(false)
              toast.success(t("account.deactivate_success"))
            },
            onError: (err) => {
              setShowDeactivateAccountDialog(false)
              notifyApiError(err)
            },
          })
        }}
      />

      <ConfirmDialog
        open={showReactivateAccountDialog}
        title={t("account.reactivate_title", { name })}
        description={t("account.reactivate_description", { name })}
        confirmLabel={t("account.reactivate_confirm")}
        isPending={reactivateAccountMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setShowReactivateAccountDialog(false)
        }}
        onConfirm={() => {
          if (!employee?.accountId) return
          reactivateAccountMutation.mutate(employee.accountId, {
            onSuccess: () => {
              setShowReactivateAccountDialog(false)
              toast.success(t("account.reactivate_success"))
            },
            onError: (err) => {
              setShowReactivateAccountDialog(false)
              notifyApiError(err)
            },
          })
        }}
      />

      {/* Delete Employee Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title={t("delete.title", { name })}
        description={t("delete.description", { name })}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false)
        }}
        onConfirm={() => {
          if (!employee) return
          deleteMutation.mutate(employee.id, {
            onSuccess: () => {
              setShowDeleteDialog(false)
              toast.success(t("delete.success"))
              void navigate("/employees")
            },
            onError: (err) => {
              setShowDeleteDialog(false)
              notifyApiError(err)
            },
          })
        }}
      />
    </MotionStack>
  )
}
