import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { FormPasswordInput } from "@/components/common/form/form-password-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { NotFoundState } from "@/components/common/not-found-state"
import { Button } from "@/components/ui/button"
import {
  useCreateOrganizationAdminAccountMutation,
  useOrganizationQuery,
} from "@/shared/queries/organization.query"
import { useToastStore } from "@/shared/stores/toast.store"

export function OrganizationCreateAdminPage() {
  const { t } = useTranslation("organizations")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const organizationQuery = useOrganizationQuery(id)
  const createMutation = useCreateOrganizationAdminAccountMutation()
  const showToast = useToastStore((state) => state.show)

  const schema = useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .trim()
          .min(1, t("create_admin.errors.first_name_required")),
        lastName: z
          .string()
          .trim()
          .min(1, t("create_admin.errors.last_name_required")),
        email: z
          .string()
          .trim()
          .email(t("form.errors.email"))
          .or(z.literal("")),
        employeeCode: z
          .string()
          .trim()
          .min(1, t("create_admin.errors.employee_code_required")),
        password: z
          .string()
          .min(8, t("create_admin.errors.password_required")),
      }),
    [t]
  )

  type FormValues = z.infer<typeof schema>

  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      employeeCode: "",
      password: "",
    },
  })

  if (!organizationQuery.data && organizationQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/"
        backLabel={t("title")}
        description={t("not_found")}
      />
    )
  }

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        organizationId: id,
        input: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email?.trim() || undefined,
          employeeCode: values.employeeCode.trim(),
          password: values.password,
        },
      })

      showToast({
        title: t("create_admin.success", { identifier: values.employeeCode.trim() }),
        variant: "success",
      })

      void navigate(`/organizations/${id}`)
    } catch (error) {
      applyApiFieldErrors(error, setError)
    }
  }

  return (
    <form className={formStackClassName} onSubmit={handleSubmit(onSubmit)}>
      <FormPageHeader
        title={t("create_admin.title")}
        subtitle={t("create_admin.subtitle")}
      />

      <FormSection legend={t("create_admin.title")}>
        <FormFieldGrid>
          <FormTextInput
            control={control}
            name="firstName"
            label={t("create_admin.first_name")}
            required
            disabled={createMutation.isPending}
          />
          <FormTextInput
            control={control}
            name="lastName"
            label={t("create_admin.last_name")}
            required
            disabled={createMutation.isPending}
          />
          <FormTextInput
            control={control}
            name="employeeCode"
            label={t("create_admin.employee_code")}
            placeholder={t("create_admin.employee_code_placeholder")}
            description={t("create_admin.employee_code_hint")}
            required
            disabled={createMutation.isPending}
          />
          <FormTextInput
            control={control}
            name="email"
            label={t("create_admin.email")}
            disabled={createMutation.isPending}
          />
          <FormPasswordInput
            control={control}
            name="password"
            label={t("create_admin.password")}
            required
            className="md:col-span-2"
            disabled={createMutation.isPending}
          />
        </FormFieldGrid>
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="outline"
          disabled={createMutation.isPending}
          onClick={() => void navigate(`/organizations/${id}`)}
        >
          {tCommon("actions.cancel")}
        </Button>
        <Button type="submit" loading={createMutation.isPending}>
          {t("create_admin.submit")}
        </Button>
      </FormActions>
    </form>
  )
}
