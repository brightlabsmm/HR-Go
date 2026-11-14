import { useTranslation } from "react-i18next"

import { MotionStack } from "@/components/common/motion-stack"
import { PageHeader } from "@/components/common/page-header"
import { RoleList } from "@/features/roles/components/role-list"

export function RoleListPage() {
  const { t } = useTranslation("roles")

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader title={t("system_title")} description={t("system_subtitle")} />
      <RoleList />
    </MotionStack>
  )
}
