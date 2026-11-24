import { motion } from "framer-motion"
import { InfoIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { RoleCatalog } from "@/features/roles/components/role-catalog"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useRolesQuery } from "@/shared/queries/role.query"

export function RoleOverviewPage() {
  const { t } = useTranslation("roles")
  const { staggerItem } = useMotionVariants()
  const navigate = useNavigate()
  const rolesQuery = useRolesQuery()
  const roles = rolesQuery.data ?? []

  function renderBody() {
    if (rolesQuery.isPending) {
      return <TableSkeleton columns={6} rows={8} />
    }

    if (roles.length === 0) {
      return (
        <PageEmptyState title={t("empty.title")} description={t("empty.description")} />
      )
    }

    return (
      <RoleCatalog
        roles={roles}
        selectedRoleId={null}
        onSelectRole={(roleId) => void navigate(`/roles/${roleId}`)}
      />
    )
  }

  return (
    <MotionStack className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("catalog_subtitle")} />
      <motion.div
        variants={staggerItem}
        className="flex items-start gap-2.5 rounded-[10px] bg-info-muted px-4 py-3 text-small-1 text-foreground"
      >
        <InfoIcon className="size-4 shrink-0 text-info" aria-hidden />
        {t("managed_hint")}
      </motion.div>
      {renderBody()}
    </MotionStack>
  )
}
