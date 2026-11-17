import { useId } from "react"
import { useTranslation } from "react-i18next"

interface StayAfterCreateCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function StayAfterCreateCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
}: StayAfterCreateCheckboxProps) {
  const { t } = useTranslation("common")
  const inputId = useId()

  return (
    <label
      htmlFor={inputId}
      className="flex max-w-sm cursor-pointer items-start gap-2 text-small-1 text-muted-foreground"
    >
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span>{t("form.stay_after_create")}</span>
    </label>
  )
}
