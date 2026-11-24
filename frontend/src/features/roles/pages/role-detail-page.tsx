import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { PageHeader } from "@/components/common/page-header"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { RolePermissionGrantEditor } from "@/features/roles/components/role-permission-grant-editor"
import { usePermissionsQuery, useRoleQuery } from "@/shared/queries/role.query"

export function RoleDetailPage() {
  const { t } = useTranslation("roles")
  const { id = "" } = useParams()
  const roleQuery = useRoleQuery(id)
  const permissionsQuery = usePermissionsQuery()
  const role = roleQuery.data

  if (!role && roleQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/roles"
        backLabel={t("title")}
        description={t("not_found")}
      />
    )
  }

  return (
    <MotionStack className="flex min-w-0 flex-col gap-8 pb-8">
      <PageHeader
        backTo="/roles"
        backLabel={t("title")}
        title={role?.roleName ?? t("detail.title")}
        description={role?.description}
      />
      {roleQuery.isPending || permissionsQuery.isPending ? (
        <TableSkeleton columns={5} rows={6} />
      ) : role ? (
        <RolePermissionGrantEditor
          role={role}
          allPermissions={permissionsQuery.data?.items ?? []}
        />
      ) : null}
    </MotionStack>
  )
}
