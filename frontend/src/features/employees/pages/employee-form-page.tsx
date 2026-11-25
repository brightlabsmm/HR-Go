import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  EyeClosed,
  EyeIcon,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { NotFoundState } from "@/components/common/not-found-state"
import { StayAfterCreateCheckbox } from "@/components/common/stay-after-create-checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RolePermissionReview } from "@/features/users/components/role-permission-review"
import { RolePicker } from "@/features/users/components/role-picker"
import { useStayAfterCreate } from "@/shared/hooks/use-stay-after-create"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useCreateEmployeeMutation,
  useEmployeeQuery,
  useUpdateEmployeeMutation,
} from "@/shared/queries/employee.query"
import { usePositionsQuery } from "@/shared/queries/position.query"
import { useRolesQuery } from "@/shared/queries/role.query"
import { toast } from "@/shared/stores/toast.store"

interface CreatedCredentials {
  employeeCode: string
  fullName: string
  generatedPassword?: string | null
}

export function EmployeeFormPage() {
  const { t } = useTranslation("employees")
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const employeeQuery = useEmployeeQuery(id ?? "")
  const branchesQuery = useBranchesQuery({ status: "active", limit: 100 })
  const departmentsQuery = useDepartmentsQuery({ status: "active", limit: 100 })
  const positionsQuery = usePositionsQuery({ status: "active", limit: 100 })
  const rolesQuery = useRolesQuery()

  const createMutation = useCreateEmployeeMutation()
  const updateMutation = useUpdateEmployeeMutation()

  const { stayAfterCreate, setStayAfterCreate } =
    useStayAfterCreate("/employees")
  const [createdCredentials, setCreatedCredentials] =
    useState<CreatedCredentials | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<"code" | "password" | "all" | null>(
    null
  )

  const [roleInitialized, setRoleInitialized] = useState(false)
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && employeeQuery.isPending

  const schema = useMemo(
    () =>
      z.object({
        employeeCode: z.string().trim().optional(),
        firstName: z
          .string()
          .trim()
          .min(1, t("form.errors.first_name")),
        lastName: z
          .string()
          .trim()
          .min(1, t("form.errors.last_name")),
        email: z
          .string()
          .trim()
          .min(1, t("form.errors.email_required"))
          .email(t("form.errors.email")),
        phone: z.string().trim().optional(),
        branchId: z
          .string()
          .min(1, t("form.errors.branch"))
          .refine((val) => val !== "none", t("form.errors.branch")),
        departmentId: z
          .string()
          .min(1, t("form.errors.department"))
          .refine((val) => val !== "none", t("form.errors.department")),
        positionId: z
          .string()
          .min(1, t("form.errors.position"))
          .refine((val) => val !== "none", t("form.errors.position")),
        roleId: z
          .string()
          .trim()
          .min(1, t("form.errors.role")),
        dateOfJoining: z.string().optional(),
        employmentStatus: z.string(),
        dateOfBirth: z
          .string()
          .trim()
          .min(1, t("form.errors.date_of_birth")),
        gender: z
          .string()
          .min(1, t("form.errors.gender"))
          .refine((val) => val !== "none", t("form.errors.gender")),
        nationality: z
          .string()
          .trim()
          .min(1, t("form.errors.nationality")),
        maritalStatus: z.string().optional(),
        address: z.string().trim().optional(),
        emergencyContact: z
          .string()
          .trim()
          .min(1, t("form.errors.emergency_contact")),
      }),
    [t]
  )

  type FormValues = z.infer<typeof schema>
  const employee = employeeQuery.data

  const { control, handleSubmit, setError, reset, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      employeeCode: employee?.employeeCode ?? "",
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      branchId: employee?.branchId ?? "none",
      departmentId: employee?.departmentId ?? "none",
      positionId: employee?.positionId ?? "none",
      roleId: employee?.roleId ?? "",
      dateOfJoining: employee?.dateOfJoining ?? "",
      employmentStatus: employee?.employmentStatus ?? "ACTIVE",
      dateOfBirth: employee?.profile?.dateOfBirth ?? "",
      gender: employee?.profile?.gender ?? "none",
      nationality: employee?.profile?.nationality ?? "",
      maritalStatus: employee?.profile?.maritalStatus ?? "none",
      address: employee?.profile?.address ?? "",
      emergencyContact: employee?.profile?.emergencyContact ?? "",
    },
  })

  const selectedRoleId = watch("roleId")
  const selectedRole =
    rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? null
  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: role.id,
    label: role.roleName,
    description: role.description ?? role.roleCode,
  }))

  useEffect(() => {
    if (roleInitialized || !rolesQuery.data || rolesQuery.data.length === 0) return

    if (isEdit) {
      if (employee) {
        if (employee.roleId) {
          setValue("roleId", employee.roleId)
        } else {
          const defaultRole =
            rolesQuery.data.find((r) => r.roleCode === "EMPLOYEE") ??
            rolesQuery.data[0]
          if (defaultRole) {
            setValue("roleId", defaultRole.id)
          }
        }
        setRoleInitialized(true)
      }
    } else {
      const defaultRole =
        rolesQuery.data.find((r) => r.roleCode === "EMPLOYEE") ??
        rolesQuery.data[0]
      if (defaultRole) {
        setValue("roleId", defaultRole.id)
      }
      setRoleInitialized(true)
    }
  }, [isEdit, employee, rolesQuery.data, roleInitialized, setValue])

  const selectedBranchId = watch("branchId")
  const filteredDepartments = (departmentsQuery.data?.items ?? []).filter(
    (dept) =>
      selectedBranchId === "none" ||
      !dept.branchId ||
      dept.branchId === selectedBranchId
  )

  const branchOptions = [
    { value: "none", label: t("form.none") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const departmentOptions = [
    { value: "none", label: t("form.none") },
    ...filteredDepartments.map((d) => ({
      value: d.id,
      label: d.departmentName,
    })),
  ]

  const positionOptions = [
    { value: "none", label: t("form.none") },
    ...(positionsQuery.data?.items ?? []).map((p) => ({
      value: p.id,
      label: `${p.positionName} (${p.positionCode})`,
    })),
  ]

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "PROBATION", label: "Probation" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "TERMINATED", label: "Terminated" },
    { value: "RESIGNED", label: "Resigned" },
  ]

  const genderOptions = [
    { value: "none", label: t("form.none") },
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ]

  const maritalStatusOptions = [
    { value: "none", label: t("form.none") },
    { value: "SINGLE", label: "Single" },
    { value: "MARRIED", label: "Married" },
    { value: "DIVORCED", label: "Divorced" },
    { value: "WIDOWED", label: "Widowed" },
    { value: "OTHER", label: "Other" },
  ]

  const handleModalClose = () => {
    const shouldStay = stayAfterCreate
    setCreatedCredentials(null)
    setShowPassword(false)
    setCopiedField(null)
    if (shouldStay) {
      const defaultRole =
        rolesQuery.data?.find((r) => r.roleCode === "EMPLOYEE") ??
        rolesQuery.data?.[0]
      reset({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        branchId: "none",
        departmentId: "none",
        positionId: "none",
        roleId: defaultRole?.id ?? "",
        dateOfJoining: "",
        employmentStatus: "ACTIVE",
        dateOfBirth: "",
        gender: "none",
        nationality: "",
        maritalStatus: "none",
        address: "",
        emergencyContact: "",
      })
    } else {
      void navigate("/employees")
    }
  }

  if (isEdit && employeeQuery.isFetched && !employee) {
    return <NotFoundState backTo="/employees" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={isEdit ? t("form.edit_title") : t("form.create_title")}
        subtitle={
          isEdit
            ? employee?.employeeCode
              ? `${employee.employeeCode} · ${employee.fullName}`
              : employee?.fullName
            : t("subtitle")
        }
      />
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          const branchId = values.branchId === "none" ? null : values.branchId
          const departmentId =
            values.departmentId === "none" ? null : values.departmentId
          const positionId =
            values.positionId === "none" ? null : values.positionId
          const gender = values.gender === "none" ? null : values.gender
          const maritalStatus =
            values.maritalStatus === "none" ? null : values.maritalStatus
          const email = values.email?.trim() ? values.email.trim() : null
          const phone = values.phone?.trim() ? values.phone.trim() : null
          const dateOfJoining = values.dateOfJoining || null
          const dateOfBirth = values.dateOfBirth || null

          try {
            if (isEdit && id) {
              await updateMutation.mutateAsync({
                id,
                input: {
                  firstName: values.firstName.trim(),
                  lastName: values.lastName.trim(),
                  email,
                  phone,
                  branchId,
                  departmentId,
                  positionId,
                  roleId: values.roleId || null,
                  dateOfJoining,
                  employmentStatus: values.employmentStatus,
                  dateOfBirth,
                  gender,
                  nationality: values.nationality?.trim() || null,
                  maritalStatus,
                  address: values.address?.trim() || null,
                  emergencyContact: values.emergencyContact?.trim() || null,
                },
              })
              toast.success(t("form.save"))
              void navigate("/employees")
            } else {
              const created = await createMutation.mutateAsync({
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email,
                phone,
                branchId,
                departmentId,
                positionId,
                roleId: values.roleId || null,
                dateOfJoining,
                employmentStatus: values.employmentStatus,
                dateOfBirth,
                gender,
                nationality: values.nationality?.trim() || null,
                maritalStatus,
                address: values.address?.trim() || null,
                emergencyContact: values.emergencyContact?.trim() || null,
              })
              toast.success(t("form.create"))
              setCreatedCredentials({
                employeeCode: created.employeeCode,
                fullName:
                  created.fullName || `${created.firstName} ${created.lastName}`,
                generatedPassword: created.generatedPassword,
              })
            }
          } catch (error) {
            applyApiFieldErrors(error, setError)
          }
        })}
      >
        <FormSection legend={t("sections.basic")}>
          {isLoading ? (
            <FormSkeleton fields={6} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="firstName"
                required
                label={t("form.first_name")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="lastName"
                required
                label={t("form.last_name")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="employmentStatus"
                label={t("form.employment_status")}
                options={statusOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="dateOfJoining"
                type="date"
                label={t("form.date_of_joining")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="email"
                type="email"
                required
                label={t("form.email")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="phone"
                type="tel"
                label={t("form.phone")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="branchId"
                required
                label={t("form.branch")}
                options={branchOptions}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="departmentId"
                required
                label={t("form.department")}
                options={departmentOptions}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="positionId"
                required
                label={t("form.position")}
                options={positionOptions}
                disabled={isPending}
              />
            </FormFieldGrid>
          )}
        </FormSection>

        <FormSection legend={t("sections.personal")}>
          {isLoading ? (
            <FormSkeleton fields={6} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="dateOfBirth"
                type="date"
                required
                label={t("form.date_of_birth")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="gender"
                required
                label={t("form.gender")}
                options={genderOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="nationality"
                required
                label={t("form.nationality")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="maritalStatus"
                label={t("form.marital_status")}
                options={maritalStatusOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="emergencyContact"
                required
                label={t("form.emergency_contact")}
                disabled={isPending}
              />
              <div className="col-span-full">
                <FormTextareaInput
                  control={control}
                  name="address"
                  label={t("form.address")}
                  disabled={isPending}
                />
              </div>
            </FormFieldGrid>
          )}
        </FormSection>

        <FormSection legend={t("sections.access")}>
          {rolesQuery.isPending ? (
            <FormSkeleton fields={1} />
          ) : (
            <div className="flex flex-col gap-6">
              <RolePicker
                control={control}
                name="roleId"
                required
                label={t("form.role")}
                options={roleOptions}
                disabled={isPending}
              />
              <div className="flex flex-col gap-3">
                <p className="text-small-1 font-medium text-foreground">
                  {t("form.permissions")}
                </p>
                <RolePermissionReview role={selectedRole} />
              </div>
            </div>
          )}
        </FormSection>

        <FormActions
          start={
            isEdit ? undefined : (
              <StayAfterCreateCheckbox
                checked={stayAfterCreate}
                onCheckedChange={setStayAfterCreate}
                disabled={isPending}
              />
            )
          }
        >
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => void navigate("/employees")}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={isPending} disabled={isLoading}>
            {isEdit ? t("form.save") : t("form.create")}
          </Button>
        </FormActions>
      </form>

      <Dialog
        open={Boolean(createdCredentials)}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose()
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
              <CheckCircle2Icon className="size-6" />
            </div>
            <DialogTitle className="text-center font-heading text-lg font-semibold text-foreground">
              Employee Created Successfully
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              Account created for{" "}
              <strong className="font-semibold text-foreground">
                {createdCredentials?.fullName}
              </strong>
              . Please share these login credentials with the employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-border bg-subtle/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Employee Code
                </div>
                <div className="font-mono text-base font-semibold text-foreground">
                  {createdCredentials?.employeeCode}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (createdCredentials?.employeeCode) {
                    void navigator.clipboard.writeText(
                      createdCredentials.employeeCode
                    )
                    setCopiedField("code")
                    setTimeout(() => setCopiedField(null), 2000)
                  }
                }}
              >
                {copiedField === "code" ? (
                  <CheckIcon className="size-4 text-emerald-600" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
                <span className="text-xs">
                  {copiedField === "code" ? "Copied" : "Copy"}
                </span>
              </Button>
            </div>

            {createdCredentials?.generatedPassword && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Temporary Password
                    </div>
                    <div className="font-mono text-base font-semibold text-foreground">
                      {showPassword
                        ? createdCredentials.generatedPassword
                        : "••••••••••••"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeClosed className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (createdCredentials?.generatedPassword) {
                          void navigator.clipboard.writeText(
                            createdCredentials.generatedPassword
                          )
                          setCopiedField("password")
                          setTimeout(() => setCopiedField(null), 2000)
                        }
                      }}
                    >
                      {copiedField === "password" ? (
                        <CheckIcon className="size-4 text-emerald-600" />
                      ) : (
                        <CopyIcon className="size-4" />
                      )}
                      <span className="text-xs">
                        {copiedField === "password" ? "Copied" : "Copy"}
                      </span>
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  The employee will be required to change this temporary password
                  upon their first login.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const text = `Employee: ${createdCredentials?.fullName}\nEmployee Code: ${createdCredentials?.employeeCode}${
                  createdCredentials?.generatedPassword
                    ? `\nTemporary Password: ${createdCredentials.generatedPassword}`
                    : ""
                }`
                void navigator.clipboard.writeText(text)
                setCopiedField("all")
                setTimeout(() => setCopiedField(null), 2000)
              }}
            >
              {copiedField === "all" ? (
                <CheckIcon className="size-4 text-emerald-600" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {copiedField === "all" ? "Credentials Copied" : "Copy All Credentials"}
            </Button>
            <Button type="button" onClick={handleModalClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
