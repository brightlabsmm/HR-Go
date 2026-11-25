import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors, notifyApiError } from "@/app/api/feedback"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormSwitchInput } from "@/components/common/form/form-switch-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { NotFoundState } from "@/components/common/not-found-state"
import { StayAfterCreateCheckbox } from "@/components/common/stay-after-create-checkbox"
import { Button } from "@/components/ui/button"
import { useStayAfterCreate } from "@/shared/hooks/use-stay-after-create"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useCreateShiftMutation,
  useShiftQuery,
  useUpdateShiftMutation,
} from "@/shared/queries/shift.query"
import { toast } from "@/shared/stores/toast.store"

export function ShiftFormPage() {
  const { t } = useTranslation("shifts")
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const shiftQuery = useShiftQuery(id ?? "")
  const branchesQuery = useBranchesQuery({ status: "active", limit: 100 })
  const createMutation = useCreateShiftMutation()
  const updateMutation = useUpdateShiftMutation()

  const { stayAfterCreate, setStayAfterCreate, finishCreate } =
    useStayAfterCreate("/shifts")
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && shiftQuery.isPending

  const schema = useMemo(
    () =>
      z.object({
        shiftName: z
          .string()
          .trim()
          .min(1, t("form.errors.name"))
          .max(100, t("form.errors.name_max")),
        startTime: z
          .string()
          .trim()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, t("form.errors.start_time")),
        endTime: z
          .string()
          .trim()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, t("form.errors.end_time")),
        breakMinutes: z
          .string()
          .trim()
          .refine((val) => {
            if (val === "") return true
            const n = Number(val)
            return Number.isInteger(n) && n >= 0 && n <= 480
          }, t("form.errors.break_minutes")),
        branchId: z.string(),
        status: z.string(),
        isDefault: z.boolean(),
      }),
    [t]
  )

  type FormValues = z.infer<typeof schema>
  const shift = shiftQuery.data

  const { control, handleSubmit, setError, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      shiftName: shift?.shiftName ?? "",
      startTime: shift?.startTime ? shift.startTime.slice(0, 5) : "09:00",
      endTime: shift?.endTime ? shift.endTime.slice(0, 5) : "18:00",
      breakMinutes: String(shift?.breakMinutes ?? 60),
      branchId: shift?.branchId ?? "none",
      status: shift?.status ?? "ACTIVE",
      isDefault: shift?.isDefault ?? false,
    },
  })

  const branchOptions = [
    { value: "none", label: t("all_branches_option") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const statusOptions = [
    { value: "ACTIVE", label: t("status.ACTIVE") },
    { value: "INACTIVE", label: t("status.INACTIVE") },
  ]

  if (isEdit && shiftQuery.isFetched && !shift) {
    return <NotFoundState backTo="/shifts" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={isEdit ? t("form.edit_title") : t("form.create_title")}
        subtitle={isEdit ? shift?.shiftName : t("subtitle")}
      />
      <form
        noValidate
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          const branchId = values.branchId === "none" ? null : values.branchId
          const breakMins = parseInt(values.breakMinutes, 10) || 0
          try {
            if (isEdit && id) {
              await updateMutation.mutateAsync({
                id,
                input: {
                  shiftName: values.shiftName.trim(),
                  startTime: values.startTime,
                  endTime: values.endTime,
                  breakMinutes: breakMins,
                  branchId,
                  status: values.status,
                  isDefault: values.isDefault,
                },
              })
              toast.success(t("form.save"))
            } else {
              await createMutation.mutateAsync({
                shiftName: values.shiftName.trim(),
                startTime: values.startTime,
                endTime: values.endTime,
                breakMinutes: breakMins,
                branchId,
                isDefault: values.isDefault,
              })
              toast.success(t("form.create"))
              finishCreate(() =>
                reset({
                  shiftName: "",
                  startTime: "09:00",
                  endTime: "18:00",
                  breakMinutes: "60",
                  branchId: "none",
                  status: "ACTIVE",
                  isDefault: false,
                })
              )
              return
            }
            void navigate("/shifts")
          } catch (error) {
            if (!applyApiFieldErrors(error, setError)) {
              notifyApiError(error)
            }
          }
        })}
      >
        <FormSection legend={t("sections.details")}>
          {isLoading ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="shiftName"
                required
                label={t("form.name")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="branchId"
                label={t("form.branch")}
                options={branchOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="startTime"
                type="time"
                required
                label={t("form.start_time")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="endTime"
                type="time"
                required
                label={t("form.end_time")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="breakMinutes"
                type="number"
                label={t("form.break_minutes")}
                disabled={isPending}
              />
              {isEdit && (
                <FormSelectInput
                  control={control}
                  name="status"
                  label={t("form.status")}
                  options={statusOptions}
                  disabled={isPending}
                />
              )}
              <div className="col-span-full pt-2">
                <FormSwitchInput
                  control={control}
                  name="isDefault"
                  label={t("form.is_default")}
                  description={t("form.is_default_desc")}
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
            onClick={() => void navigate("/shifts")}
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
