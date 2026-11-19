import { cn } from "cn"
import { motion } from "framer-motion"
import { ShieldCheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ToneBadge } from "@/components/common/tone-badge"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"

import type { Role } from "@/shared/services/role.service"

interface RoleCatalogProps {
  roles: Role[]
  selectedRoleId: string | null
  onSelectRole: (roleId: string) => void
}

export function RoleCatalog({
  roles,
  selectedRoleId,
  onSelectRole,
}: RoleCatalogProps) {
  const { t } = useTranslation("roles")
  const { staggerItem } = useMotionVariants()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {t("catalog_heading")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => {
          const isSelected = selectedRoleId === role.id

          return (
            <motion.button
              key={role.id}
              type="button"
              variants={staggerItem}
              aria-pressed={isSelected}
              onClick={() => onSelectRole(role.id)}
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-[10px] border border-border bg-surface px-4 py-4 text-left outline-none transition-colors duration-200",
                "hover:border-primary/40 hover:bg-accent/40",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected && "border-primary bg-accent"
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <ShieldCheckIcon className="size-4" aria-hidden />
                </span>
                <ToneBadge tone={isSelected ? "brand" : "neutral"}>
                  {t("selected_count", { count: role.permissions.length })}
                </ToneBadge>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-small-1 font-semibold text-secondary">
                  {role.roleName}
                </span>
                <span className="text-small-2 text-muted-foreground">{role.roleCode}</span>
              </span>
              {role.description ? (
                <span className="line-clamp-2 text-small-2 text-muted-foreground">
                  {role.description}
                </span>
              ) : null}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
