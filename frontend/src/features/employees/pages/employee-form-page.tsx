import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useStayAfterCreate } from "@/shared/hooks/use-stay-after-create"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useCreateEmployeeMutation,
  useEmployeeQuery,
  useUpdateEmployeeMutation,
} from "@/shared/queries/employee.query"
import { usePositionsQuery } from "@/shared/queries/position.query"
import { toast } from "@/shared/stores/toast.store"

export function EmployeeFormPage() {
  const { t } = useTranslation("employees")
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const employeeQuery = useEmployeeQuery(id ?? "")
  const branchesQuery = useBranchesQuery({ status: "active", limit: 100 })
  const departmentsQuery = useDepartmentsQuery({ status: "active", limit: 100 })
  const positionsQuery = usePositionsQuery({ status: "active", limit: 100 })

  const createMutation = useCreateEmployeeMutation()
  const updateMutation = useUpdateEmployeeMutation()

  const { stayAfterCreate, setStayAfterCreate, finishCreate } =
    useStayAfterCreate("/employees")
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && employeeQuery.isPending

  const schema = useMemo(
    () =>
      z.object({
        employeeCode: z
          .string()
          .trim()
          .min(1, t("form.errors.code")),
        firstName: z
          .string()
          .trim()
          .min(1, t("form.errors.first_name")),
        lastName: z
          .string()
          .trim()
          .min(1, t("form.errors.last_name")),
        email: z.string().trim().email(t("form.errors.email")).or(z.literal("")),
        phone: z.string().trim().optional(),
        branchId: z.string(),
        departmentId: z.string(),
        positionId: z.string(),
        dateOfJoining: z.string().optional(),
        employmentStatus: z.string(),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        nationality: z.string().trim().optional(),
        maritalStatus: z.string().optional(),
        address: z.string().trim().optional(),
        emergencyContact: z.string().trim().optional(),
      }),
    [t]
  )

  type FormValues = z.infer<typeof schema>
  const employee = employeeQuery.data

  const { control, handleSubmit, setError, reset, watch } = useForm<FormValues>({
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

  if (isEdit && employeeQuery.isFetched && !employee) {
    return <NotFoundState backTo="/employees" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={isEdit ? t("form.edit_title") : t("form.create_title")}
        subtitle={isEdit ? employee?.fullName : t("subtitle")}
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
            } else {
              await createMutation.mutateAsync({
                employeeCode: values.employeeCode.trim(),
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email,
                phone,
                branchId,
                departmentId,
                positionId,
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
              finishCreate(() =>
                reset({
                  employeeCode: "",
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  branchId: "none",
                  departmentId: "none",
                  positionId: "none",
                  dateOfJoining: "",
                  employmentStatus: "ACTIVE",
                  dateOfBirth: "",
                  gender: "none",
                  nationality: "",
                  maritalStatus: "none",
                  address: "",
                  emergencyContact: "",
                })
              )
              return
            }
            void navigate("/employees")
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
                name="employeeCode"
                required
                disabled={isEdit || isPending}
                label={t("form.code")}
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
              <FormTextInput
                control={control}
                name="email"
                type="email"
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
                label={t("form.branch")}
                options={branchOptions}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="departmentId"
                label={t("form.department")}
                options={departmentOptions}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="positionId"
                label={t("form.position")}
                options={positionOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="dateOfJoining"
                type="date"
                label={t("form.date_of_joining")}
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
                label={t("form.date_of_birth")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="gender"
                label={t("form.gender")}
                options={genderOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="nationality"
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
    </section>
  )
}
