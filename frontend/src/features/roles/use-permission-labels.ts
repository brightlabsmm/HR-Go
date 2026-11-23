import { useTranslation } from "react-i18next"

const COMPOUND_ACTIONS = new Set(["status.update"])

export function splitPermission(code: string) {
  const parts = code.split(".")

  if (parts.length >= 3) {
    const compound = `${parts.at(-2)}.${parts.at(-1)}`
    if (COMPOUND_ACTIONS.has(compound)) {
      return {
        resource: parts.slice(0, -2).join("."),
        action: compound.replaceAll(".", "_"),
      }
    }
  }

  return {
    resource: parts.slice(0, -1).join(".") || code,
    action: parts.at(-1) ?? code,
  }
}

export function usePermissionLabels() {
  const { t } = useTranslation("roles")

  return {
    groupingLabel: (grouping: string) => {
      const key = grouping.replaceAll(".", "_").toLowerCase()
      return t(`groupings.${key}`, {
        defaultValue: grouping
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      })
    },
    resourceLabel: (resource: string) => {
      const key = resource.replaceAll(".", "_")
      const short = resource.split(".").at(-1) ?? resource

      return t(`resources.${key}`, {
        defaultValue: t(`resources.${short}`, {
          defaultValue: resource.replaceAll(".", " / ").replaceAll("_", " "),
        }),
      })
    },
    actionLabel: (action: string) => {
      const key = action.replaceAll(".", "_")
      return t(`actions.${key}`, {
        defaultValue: action.replaceAll(".", " "),
      })
    },
    permissionLabel: (perm: { code: string; action?: string; description?: string | null }) => {
      const cleanKey = perm.code.replaceAll(".", "_").toLowerCase()
      const specificKey = `permissions.${cleanKey}`
      const translated = t(specificKey)
      if (translated && translated !== specificKey) {
        return translated
      }

      const { action } = splitPermission(perm.code)
      const actionKey = (perm.action ?? action).replaceAll(".", "_")
      return t(`actions.${actionKey}`, {
        defaultValue: (perm.action ?? action).replaceAll(".", " "),
      })
    },
  }
}
