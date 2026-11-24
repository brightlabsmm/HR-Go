import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Navigate, useNavigate } from "react-router"
import { z } from "zod"

import { FormPasswordInput } from "@/components/common/form/form-password-input"
import { Button } from "@/components/ui/button"
import { getAuthErrorAlert } from "@/features/auth/auth-error-alert"
import { AuthAlert } from "@/features/auth/components/auth-alert"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useChangePasswordMutation, useLogoutMutation } from "@/shared/queries/auth.query"
import { useAuthStore } from "@/shared/stores/auth.store"
import { toast } from "@/shared/stores/toast.store"

export function ChangePasswordPage() {
  const { t } = useTranslation("auth")
  const { slideUp } = useMotionVariants()
  const navigate = useNavigate()
  const changePasswordMutation = useChangePasswordMutation()
  const logoutMutation = useLogoutMutation()

  const accessToken = useAuthStore((state) => state.accessToken)
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)

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
            .min(8, t("change_password.new_password_min")),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (!mustChangePassword) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values: FormValues) => {
    if (changePasswordMutation.isPending) {
      return
    }

    setAuthError(null)

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      toast.success(t("change_password.success_toast"))
      void navigate("/", { replace: true })
    } catch (error) {
      setAuthError(getAuthErrorAlert(error, t))
    }
  }

  const onLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } finally {
      void navigate("/login", { replace: true })
    }
  }

  return (
    <motion.section
      className="flex min-h-0 flex-col"
      initial="hidden"
      animate="visible"
      variants={slideUp}
    >
      <div className="flex flex-col">
        <h1 className="text-title-1 font-semibold tracking-[-0.01em] text-secondary">
          {t("change_password.title")}
        </h1>
        <p className="mt-1.5 mb-6 text-body-2 text-muted-foreground">
          {t("change_password.subtitle")}
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {authError ? (
          <AuthAlert
            title={authError.title}
            description={authError.description}
          />
        ) : null}

        <div className="flex flex-col gap-4">
          <FormPasswordInput
            control={form.control}
            name="currentPassword"
            autoComplete="current-password"
            label={t("change_password.current_password_label")}
            placeholder={t("change_password.current_password_placeholder")}
          />
          <FormPasswordInput
            control={form.control}
            name="newPassword"
            autoComplete="new-password"
            label={t("change_password.new_password_label")}
            placeholder={t("change_password.new_password_placeholder")}
          />
          <FormPasswordInput
            control={form.control}
            name="confirmPassword"
            autoComplete="new-password"
            label={t("change_password.confirm_password_label")}
            placeholder={t("change_password.confirm_password_placeholder")}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            className="h-input w-full"
            loading={changePasswordMutation.isPending}
          >
            {t("change_password.submit_button")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onLogout}
            disabled={logoutMutation.isPending}
          >
            {t("change_password.sign_out")}
          </Button>
        </div>
      </form>
    </motion.section>
  )
}
export default ChangePasswordPage
