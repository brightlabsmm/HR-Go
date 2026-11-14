import { cn } from "cn"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/constants/locales"
import { useLocaleStore } from "@/shared/stores/locale.store"

interface LanguageSwitcherProps {
  appearance?: "default" | "plain"
}

export function LanguageSwitcher({
  appearance = "default",
}: LanguageSwitcherProps) {
  const { t } = useTranslation("common")
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const items = SUPPORTED_LOCALES.map((item) => ({
    value: item,
    label: t(`locale.${item}`),
  }))

  return (
    <Select
      items={items}
      value={locale}
      onValueChange={(value) => {
        if (value) {
          setLocale(value as SupportedLocale)
        }
      }}
    >
      <SelectTrigger
        aria-label={t("language")}
        className={cn(
          "w-auto",
          appearance === "plain" &&
            "h-8 min-w-0 gap-2 border-0 bg-transparent px-0 text-secondary shadow-none focus-visible:ring-0 data-popup-open:border-transparent"
        )}
      >
        {appearance === "plain" ? (
          <Globe className="size-6 text-secondary" aria-hidden />
        ) : null}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
