import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPasswordInput } from "@/components/common/form/form-password-input"
import { Button } from "@/components/ui/button"
import { PASSWORD_PATTERN } from "@/constants/timezones"
import { getAuthErrorAlert } from "@/features/auth/auth-error-alert"
import { AuthAlert } from "@/features/auth/components/auth-alert"
import { useChangePasswordMutation } from "@/shared/queries/auth.query"
import { toast } from "@/shared/stores/toast.store"
import { isCommonPassword } from "@/util/password"

export function AccountPasswordForm() {
  const { t } = useTranslation("account")
  const { t: tAuth } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const changePasswordMutation = useChangePasswordMutation()

  const [authError, setAuthError] = useState<{
    title: string
    description?: string
  } | null>(null)

  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(1, t("change_password.current_password_required")),
          newPassword: z
            .string()
            .min(8, t("change_password.new_password_min"))
            .regex(
              PASSWORD_PATTERN,
              t("change_password.new_password_complexity")
            )
            .refine((val) => !isCommonPassword(val), {
              message: t("change_password.password_common"),
            }),
          confirmPassword: z
            .string()
            .min(1, t("change_password.confirm_password_required")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("change_password.passwords_must_match"),
          path: ["confirmPassword"],
        })
        .refine((data) => data.currentPassword !== data.newPassword, {
          message: t("change_password.password_must_differ"),
          path: ["newPassword"],
        }),
    [t]
  )

  type FormValues = z.infer<typeof schema>

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setAuthError(null)
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      toast.success(t("change_password.success"))
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      setAuthError(getAuthErrorAlert(error, tAuth))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {authError ? (
        <AuthAlert
          title={authError.title}
          description={authError.description}
        />
      ) : null}
      <FormFieldGrid>
        <FormPasswordInput
          control={control}
          name="currentPassword"
          label={t("change_password.current_password")}
          required
          autoComplete="current-password"
          disabled={changePasswordMutation.isPending}
        />
        <FormPasswordInput
          control={control}
          name="newPassword"
          label={t("change_password.new_password")}
          required
          autoComplete="new-password"
          disabled={changePasswordMutation.isPending}
        />
        <FormPasswordInput
          control={control}
          name="confirmPassword"
          label={t("change_password.confirm_password")}
          required
          autoComplete="new-password"
          disabled={changePasswordMutation.isPending}
        />
      </FormFieldGrid>
      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={changePasswordMutation.isPending}>
          {changePasswordMutation.isPending
            ? tCommon("actions.saving", "Saving...")
            : t("change_password.submit")}
        </Button>
      </div>
    </form>
  )
}
