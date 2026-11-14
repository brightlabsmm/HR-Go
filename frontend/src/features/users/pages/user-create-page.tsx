import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormPasswordInput } from "@/components/common/form/form-password-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { Button } from "@/components/ui/button"
import { RolePicker } from "@/features/users/components/role-picker"
import { PASSWORD_PATTERN } from "@/constants/timezones"
import { useRolesQuery } from "@/shared/queries/role.query"
import { useCreateUserMutation } from "@/shared/queries/user.query"

export function UserCreatePage() {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const rolesQuery = useRolesQuery()
  const createMutation = useCreateUserMutation()
  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(1, t("form.errors.full_name")),
        email: z
          .string()
          .trim()
          .min(1, t("form.errors.email_required"))
          .email(t("form.errors.email_invalid")),
        password: z.string().regex(PASSWORD_PATTERN, t("form.errors.password")),
        roleIds: z.array(z.string()),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      roleIds: [],
    },
  })
  const isPending = createMutation.isPending
  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: role.id,
    label: role.roleName,
    description: role.description ?? role.roleCode,
  }))

  return (
    <section className="pb-6">
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          try {
            await createMutation.mutateAsync({
              fullName: values.fullName.trim(),
              email: values.email.trim(),
              password: values.password,
              roleIds: values.roleIds,
            })
            void navigate("/users")
          } catch (error) {
            applyApiFieldErrors(error, setError)
          }
        })}
      >
        <FormPageHeader title={t("create.title")} subtitle={t("create.subtitle")} />
        <FormSection legend={t("sections.profile")}>
          <FormFieldGrid>
            <FormTextInput
              control={control}
              name="fullName"
              required
              label={t("form.full_name")}
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
            <FormPasswordInput
              control={control}
              name="password"
              required
              generatable
              label={t("form.password")}
              autoComplete="new-password"
              className="md:col-span-2"
              disabled={isPending}
            />
          </FormFieldGrid>
        </FormSection>
        <FormSection legend={t("sections.access")}>
          {rolesQuery.isPending ? (
            <FormSkeleton fields={1} />
          ) : (
            <RolePicker
              control={control}
              name="roleIds"
              label={t("form.roles")}
              options={roleOptions}
              disabled={isPending}
            />
          )}
        </FormSection>
        <FormActions>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => void navigate("/users")}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={isPending}>
            {t("create.submit")}
          </Button>
        </FormActions>
      </form>
    </section>
  )
}
