import { useState } from "react"
import { CheckCircleIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { isPlatformPortal } from "@/app/portal"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailActionButton } from "@/components/common/detail-action-button"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { ToneBadge } from "@/components/common/tone-badge"
import { RolePermissionReview } from "@/features/users/components/role-permission-review"
import { UserDetailHeader } from "@/features/users/components/user-detail-header"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useCurrentUserQuery } from "@/shared/queries/auth.query"
import { useRolesQuery } from "@/shared/queries/role.query"
import {
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUserQuery,
} from "@/shared/queries/user.query"
import { formatDateTime } from "@/util/format-date"
import { getInitials } from "@/util/initials"

export function UserDetailPage() {
  const { t, i18n } = useTranslation("users")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const userQuery = useUserQuery(id)
  const meQuery = useCurrentUserQuery()
  const { can } = usePermissions()
  const isPlatform = isPlatformPortal()
  const canUpdate = isPlatform
    ? can("platform.user.update")
    : can("org.user.update") || can("org.role.assign")
  const canDeactivate = isPlatform
    ? can("platform.user.deactivate")
    : can("org.user.deactivate") || can("org.role.assign")
  const deactivateMutation = useDeactivateUserMutation()
  const reactivateMutation = useReactivateUserMutation()
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const rolesQuery = useRolesQuery()
  const user = userQuery.data
  const isSelf = meQuery.data?.id === id
  const isInactive = user?.status.toUpperCase() === "INACTIVE"
  const assignedRole =
    rolesQuery.data?.find(
      (role) => role.roleCode === user?.roles[0]?.roleCode
    ) ?? null
  const roleName = assignedRole?.roleName ?? user?.roles[0]?.roleName

  if (!user && userQuery.isFetched) {
    return (
      <NotFoundState backTo="/users" backLabel={t("title")} description={t("not_found")} />
    )
  }

  const name = user?.fullName ?? ""
  const profileItems = [
    { label: t("form.full_name"), value: user?.fullName },
    { label: t("form.email"), value: user?.email },
    {
      label: t("last_login_at"),
      value: user ? formatDateTime(user.lastLoginAt, i18n.language) : null,
    },
  ]
  const roleBadge = roleName ? (
    <ToneBadge tone="brand">{roleName}</ToneBadge>
  ) : null

  return (
    <MotionStack className="flex flex-col gap-8 pb-2">
      <UserDetailHeader
        userId={id}
        actions={
          <>
            {canUpdate ? (
              <DetailActionButton
                onClick={() => void navigate(`/users/${id}/edit`)}
              >
                <PencilIcon />
                {tCommon("actions.edit")}
              </DetailActionButton>
            ) : null}
            {canUpdate && user && isInactive && !isSelf ? (
              <DetailActionButton
                tone="success"
                loading={reactivateMutation.isPending}
                onClick={() => setShowReactivateDialog(true)}
              >
                <CheckCircleIcon />
                {t("detail.reactivate")}
              </DetailActionButton>
            ) : null}
            {canDeactivate && user && !isInactive && !isSelf ? (
              <DetailActionButton
                tone="destructive"
                onClick={() => setShowDeactivateDialog(true)}
              >
                <Trash2Icon />
                {t("detail.deactivate")}
              </DetailActionButton>
            ) : null}
          </>
        }
      />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={userQuery.isPending}
          avatarSize="xl"
          title={name}
          subtitle={user?.email}
          initials={getInitials(...name.split(" "))}
          badges={
            user ? (
              <>
                <StatusBadge status={user.status} />
                {roleBadge}
              </>
            ) : null
          }
        />
        <div className="flex min-w-0 flex-col gap-8">
          {userQuery.isPending ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <>
              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.profile")}
                </h2>
                <DetailList columns={2} items={profileItems} />
              </section>
              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.access")}
                </h2>
                <div className="flex flex-col gap-8">
                  <DetailList items={[{ label: t("form.role"), value: roleBadge }]} />
                  <div className="flex flex-col gap-3">
                    <h3 className="text-small-1 font-medium text-foreground">
                      {t("form.permissions")}
                    </h3>
                    <RolePermissionReview role={assignedRole} />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={showDeactivateDialog}
        title={t("deactivate.title")}
        description={t("deactivate.description")}
        confirmLabel={t("deactivate.confirm")}
        confirmVariant="destructive"
        isPending={deactivateMutation.isPending}
        onOpenChange={setShowDeactivateDialog}
        onConfirm={() => {
          deactivateMutation.mutate(id, {
            onSuccess: () => setShowDeactivateDialog(false),
          })
        }}
      />
      <ConfirmDialog
        open={showReactivateDialog}
        title={t("reactivate.title")}
        description={t("reactivate.description")}
        confirmLabel={t("reactivate.confirm")}
        isPending={reactivateMutation.isPending}
        onOpenChange={setShowReactivateDialog}
        onConfirm={() => {
          reactivateMutation.mutate(id, {
            onSuccess: () => setShowReactivateDialog(false),
          })
        }}
      />
    </MotionStack>
  )
}
