import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

import { isPlatformPortal } from "@/app/portal"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { PageHeader } from "@/components/common/page-header"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { ToneBadge } from "@/components/common/tone-badge"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useCurrentUserQuery } from "@/shared/queries/auth.query"
import { getInitials } from "@/util/initials"

export function AccountPage() {
  const { t } = useTranslation("account")
  const { staggerItem } = useMotionVariants()
  const { data: user, isPending } = useCurrentUserQuery()
  const isPlatform = isPlatformPortal()
  const fullName = user?.fullName ?? ""
  const profileItems = isPlatform
    ? [
        { label: t("name"), value: fullName },
        { label: t("email"), value: user?.email },
        {
          label: t("roles"),
          value: user?.roles.map((role) => role.roleName).join(", "),
        },
      ]
    : [
        { label: t("name"), value: fullName },
        { label: t("employee_code"), value: user?.employeeCode },
        { label: t("organization"), value: user?.organizationCode },
        {
          label: t("roles"),
          value: user?.roles.map((role) => role.roleName).join(", "),
        },
      ]

  return (
    <MotionStack className="flex flex-col gap-8 pb-2">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={isPending}
          title={fullName}
          subtitle={user?.email ?? user?.employeeCode}
          initials={getInitials(...fullName.split(" "))}
          badges={
            user ? (
              <>
                <StatusBadge status={user.status} />
                {user.roles.map((role) => (
                  <ToneBadge key={`${role.roleCode}-${role.branchId ?? ""}`} tone="brand">
                    {role.roleName}
                  </ToneBadge>
                ))}
              </>
            ) : null
          }
        />
        <motion.section variants={staggerItem} className="min-w-0 border-t border-hair pt-2">
          <h2 className="mt-4 mb-6 text-body-2 font-semibold text-foreground">
            {t("sections.profile")}
          </h2>
          {isPending ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <DetailList columns={2} items={profileItems} />
          )}
        </motion.section>
      </div>
    </MotionStack>
  )
}
