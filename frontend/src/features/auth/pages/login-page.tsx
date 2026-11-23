import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { z } from "zod"

import { isPlatformPortal } from "@/app/portal"
import { FormPasswordInput } from "@/components/common/form/form-password-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { Button } from "@/components/ui/button"
import { getAuthErrorAlert } from "@/features/auth/auth-error-alert"
import { AuthAlert } from "@/features/auth/components/auth-alert"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useLoginMutation } from "@/shared/queries/auth.query"

export function LoginPage() {
  const { t } = useTranslation("auth")
  const { slideUp } = useMotionVariants()
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const isPlatform = isPlatformPortal()
  const [authError, setAuthError] = useState<{
    title: string
    description?: string
  } | null>(null)

  const loginSchema = useMemo(
    () =>
      isPlatform
        ? z.object({
            email: z
              .string()
              .trim()
              .min(1, t("login.email_required"))
              .email(t("login.email_invalid")),
            password: z.string().min(1, t("login.password_required")),
          })
        : z.object({
            identifier: z.string().trim().min(1, t("login.identifier_required")),
            password: z.string().min(1, t("login.password_required")),
          }),
    [isPlatform, t]
  )

  type LoginFormValues = z.infer<typeof loginSchema>

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: isPlatform
      ? { email: "", password: "" }
      : { identifier: "", password: "" },
  })

  const onLogin = async (values: LoginFormValues) => {
    if (loginMutation.isPending) {
      return
    }

    setAuthError(null)

    try {
      const session = await loginMutation.mutateAsync({
        password: values.password,
        ...("email" in values ? { email: values.email } : {}),
        ...("identifier" in values ? { identifier: values.identifier } : {}),
      })
      if (session.user.mustChangePassword) {
        void navigate("/change-password", { replace: true })
      } else {
        void navigate("/", { replace: true })
      }
    } catch (error) {
      setAuthError(getAuthErrorAlert(error, t))
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
          {t("login.title")}
        </h1>
        <p className="mt-1.5 mb-9 text-body-2 text-muted-foreground">
          {t(isPlatform ? "login.subtitle_platform" : "login.subtitle")}
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={loginForm.handleSubmit(onLogin)}
      >
        {authError ? (
          <AuthAlert
            title={authError.title}
            description={authError.description}
          />
        ) : null}
        <div className="flex flex-col">
          {isPlatform ? (
            <FormTextInput
              control={loginForm.control}
              name={"email" as never}
              type="email"
              reserveErrorSpace
              autoComplete="username"
              label={t("login.email_label")}
              placeholder={t("login.email_placeholder")}
            />
          ) : (
            <FormTextInput
              control={loginForm.control}
              name={"identifier" as never}
              reserveErrorSpace
              autoComplete="username"
              label={t("login.identifier_label")}
              placeholder={t("login.identifier_placeholder")}
            />
          )}
          <FormPasswordInput
            control={loginForm.control}
            name={"password" as never}
            reserveErrorSpace
            autoComplete="current-password"
            label={t("login.password_label")}
            placeholder={t("login.password_placeholder")}
          />
        </div>
        <Button
          type="submit"
          className="h-input w-full"
          loading={loginMutation.isPending}
        >
          {t("login.submit_button")}
        </Button>
      </form>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-grey" />
          <span className="text-body-2 text-grey">{t("login.or")}</span>
          <div className="h-px flex-1 bg-grey" />
        </div>
        <AuthAlert
          variant="help"
          title={t("login.help_title")}
          description={t("login.help_body")}
        />
      </div>
    </motion.section>
  )
}
