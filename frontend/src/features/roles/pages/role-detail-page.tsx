import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { PageHeader } from "@/components/common/page-header"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { RolePermissionList } from "@/features/roles/components/role-permission-list"
import { useRoleQuery } from "@/shared/queries/role.query"

export function RoleDetailPage() {
  const { t } = useTranslation("roles")
  const { id = "" } = useParams()
  const roleQuery = useRoleQuery(id)
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
    <MotionStack className="flex flex-col gap-8 pb-8">
      <PageHeader
        backTo="/roles"
        backLabel={t("title")}
        title={role?.roleName ?? t("detail.title")}
        description={role?.description}
      />
      {roleQuery.isPending ? (
        <TableSkeleton columns={5} rows={6} />
      ) : role ? (
        <RolePermissionList role={role} />
      ) : null}
    </MotionStack>
  )
}
