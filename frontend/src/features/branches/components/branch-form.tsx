import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { StayAfterCreateCheckbox } from "@/components/common/stay-after-create-checkbox"
import { Button } from "@/components/ui/button"
import { useStayAfterCreate } from "@/shared/hooks/use-stay-after-create"

export const BRANCH_FORM_DEFAULTS = {
  branchName: "",
  parentId: "none",
  address: "",
} as const

export type BranchFormValues = {
  branchName: string
  parentId: string
  address: string
}

const FORM_ERROR_FIELDS = new Set<string>([
  "branchName",
  "parentId",
  "address",
])

interface BranchFormProps {
  isPending?: boolean
  isEdit?: boolean
  parentOptions?: Array<{ value: string; label: string }>
  defaultValues?: Partial<BranchFormValues>
  submitLabel?: string
  title?: string
  subtitle?: string
  listPath?: string
  onCancel: () => void
  onSubmit: (values: BranchFormValues) => Promise<void>
}

export function BranchForm({
  isPending = false,
  isEdit = false,
  parentOptions = [],
  defaultValues,
  submitLabel,
  title,
  subtitle,
  listPath = "/",
  onCancel,
  onSubmit,
}: BranchFormProps) {
  const { t } = useTranslation("branches")
  const { t: tCommon } = useTranslation("common")
  const { stayAfterCreate, setStayAfterCreate, finishCreate } =
    useStayAfterCreate(listPath)
  const schema = useMemo(
    () =>
      z.object({
        branchName: z.string().trim().min(1, t("form.errors.name_required")),
        parentId: z.string(),
        address: z.string(),
      }),
    [t]
  )
  const { control, handleSubmit, setError, reset } = useForm<BranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...BRANCH_FORM_DEFAULTS,
      ...defaultValues,
    },
  })

  return (
    <form
      className={formStackClassName}
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values)
          if (!isEdit) {
            finishCreate(() => reset({ ...BRANCH_FORM_DEFAULTS }))
          }
        } catch (error) {
          applyApiFieldErrors(error, setError, FORM_ERROR_FIELDS)
        }
      })}
    >
      <FormPageHeader
        title={title ?? t("form.title")}
        subtitle={subtitle ?? t("form.subtitle")}
      />

      <FormSection legend={t("form.information")}>
        <FormFieldGrid>
          <FormTextInput
            control={control}
            name="branchName"
            label={t("form.name")}
            placeholder={t("form.name_placeholder")}
            required
            disabled={isPending}
          />
          <FormSelectInput
            control={control}
            name="parentId"
            label={t("form.parent")}
            options={[{ value: "none", label: t("form.none") }, ...parentOptions]}
            disabled={isPending}
          />
          <FormTextareaInput
            control={control}
            name="address"
            label={t("form.address")}
            placeholder={t("form.address_placeholder")}
            className="lg:col-span-2"
            disabled={isPending}
          />
        </FormFieldGrid>
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
          onClick={onCancel}
        >
          {tCommon("actions.cancel")}
        </Button>
        <Button type="submit" loading={isPending}>
          {submitLabel ?? t("form.create")}
        </Button>
      </FormActions>
    </form>
  )
}
