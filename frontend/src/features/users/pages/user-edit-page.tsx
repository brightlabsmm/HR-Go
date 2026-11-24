import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { isPlatformPortal } from "@/app/portal"
import { applyApiFieldErrors } from "@/app/api/feedback"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { ForbiddenState } from "@/components/common/forbidden-state"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { NotFoundState } from "@/components/common/not-found-state"
import { Button } from "@/components/ui/button"
import { RolePermissionReview } from "@/features/users/components/role-permission-review"
import { RolePicker } from "@/features/users/components/role-picker"
import { UserDetailHeader } from "@/features/users/components/user-detail-header"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useCurrentUserQuery } from "@/shared/queries/auth.query"
import { useRolesQuery } from "@/shared/queries/role.query"
import {
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useReplaceUserRolesMutation,
  useUpdateUserMutation,
  useUserQuery,
} from "@/shared/queries/user.query"

export function UserEditPage() {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const userQuery = useUserQuery(id)
  const meQuery = useCurrentUserQuery()
  const { can, isPending: isPermissionsPending } = usePermissions()
  const rolesQuery = useRolesQuery()
  const updateMutation = useUpdateUserMutation()
  const rolesMutation = useReplaceUserRolesMutation()
  const deactivateMutation = useDeactivateUserMutation()
  const reactivateMutation = useReactivateUserMutation()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const target = userQuery.data
  const isLoading = userQuery.isPending
  const isPending = updateMutation.isPending || rolesMutation.isPending
  const isSelf = meQuery.data?.id === id
  const isInactive = target?.status.toUpperCase() === "INACTIVE"
  const detailPath = `/users/${id}`
  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(1, t("form.errors.full_name")),
        email: z.string().trim().email(t("form.errors.email_invalid")),
        roleId: z.string().min(1, t("form.errors.role")),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const roleId =
    rolesQuery.data?.find(
      (item) => item.roleCode === target?.roles[0]?.roleCode
    )?.id ?? ""
  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      fullName: target?.fullName ?? "",
      email: target?.email ?? "",
      roleId,
    },
  })
  const selectedRoleId = useWatch({ control, name: "roleId" })
  const selectedRole =
    rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? null
  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: role.id,
    label: role.roleName,
    description: role.description ?? role.roleCode,
  }))

  if (!target && userQuery.isFetched) {
    return (
      <NotFoundState backTo="/users" backLabel={t("title")} description={t("not_found")} />
    )
  }

  const isPlatform = isPlatformPortal()
  const canUpdateUser = isPlatform
    ? can("platform.user.update")
    : can("org.user.update") || can("org.role.assign")

  if (!isPermissionsPending && !canUpdateUser) {
    return <ForbiddenState backTo="/users" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col pb-6">
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          try {
            await updateMutation.mutateAsync({
              id,
              input: {
                fullName: values.fullName.trim(),
                email: values.email.trim(),
              },
            })
            if (!isSelf) {
              await rolesMutation.mutateAsync({ id, roleIds: [values.roleId] })
            }
            void navigate(detailPath)
          } catch (error) {
            applyApiFieldErrors(error, setError)
          }
        })}
      >
        <UserDetailHeader
          userId={id}
          backTo={detailPath}
          backLabel={target?.fullName ?? t("detail.title")}
          description={t("form.edit_subtitle")}
        />
        <FormSection
          legend={t("sections.profile")}
          description={t("sections.profile_description")}
        >
          {isLoading ? (
            <FormSkeleton fields={2} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="fullName"
                label={t("form.full_name")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="email"
                type="email"
                label={t("form.email")}
                disabled={isPending}
              />
            </FormFieldGrid>
          )}
        </FormSection>
        <FormSection
          legend={t("sections.access")}
          description={t("sections.access_description")}
        >
          {isLoading || rolesQuery.isPending ? (
            <FormSkeleton fields={1} />
          ) : (
            <div className="flex flex-col gap-6">
              <RolePicker
                control={control}
                name="roleId"
                label={t("form.role")}
                options={roleOptions}
                disabled={isSelf || isPending}
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
        <FormActions>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => void navigate(detailPath)}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={isPending} disabled={isLoading}>
            {t("form.save")}
          </Button>
        </FormActions>
      </form>

      <FormSection
        legend={t("sections.danger")}
        description={t("sections.danger_description")}
        tone="danger"
      >
        <div className="flex justify-end">
          {isInactive ? (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || isSelf}
              loading={reactivateMutation.isPending}
              onClick={() => reactivateMutation.mutate(id)}
            >
              {t("detail.reactivate")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading || isSelf}
              onClick={() => setConfirmDeactivate(true)}
            >
              {t("detail.deactivate")}
            </Button>
          )}
        </div>
      </FormSection>

      <ConfirmDialog
        open={confirmDeactivate}
        title={t("deactivate.title")}
        description={t("deactivate.description")}
        confirmLabel={t("deactivate.confirm")}
        isPending={deactivateMutation.isPending}
        onOpenChange={setConfirmDeactivate}
        onConfirm={() => {
          deactivateMutation.mutate(id, {
            onSuccess: () => {
              setConfirmDeactivate(false)
              void navigate("/users")
            },
          })
        }}
      />
    </section>
  )
}
