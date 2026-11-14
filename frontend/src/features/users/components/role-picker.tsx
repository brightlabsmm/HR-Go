import { CheckIcon } from "lucide-react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import { FieldError } from "@/components/ui/field"

export interface RolePickerOption {
  value: string
  label: string
  description?: string | null
  disabled?: boolean
}

interface RolePickerProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  options: RolePickerOption[]
  disabled?: boolean
}

export function RolePicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled = false,
}: RolePickerProps<TFieldValues>) {
  const { t } = useTranslation("roles")

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = new Set<string>(
          Array.isArray(field.value) ? (field.value as string[]) : []
        )

        return (
          <fieldset className="flex flex-col gap-3" disabled={disabled}>
            <legend className="mb-3 text-small-1 font-medium text-foreground">{label}</legend>
            <div className="grid gap-2.5 md:grid-cols-2">
              {options.map((option) => {
                const checked = selected.has(option.value)
                const isDisabled = disabled || option.disabled

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[10px] border border-border bg-surface px-4 py-3.5",
                      checked &&
                        "border-[color-mix(in_srgb,var(--primary)_45%,white)] bg-[color-mix(in_srgb,var(--accent)_55%,white)]",
                      isDisabled && "cursor-not-allowed opacity-55"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={isDisabled}
                      onChange={() => {
                        const next = new Set(selected)
                        if (checked) {
                          next.delete(option.value)
                        } else {
                          next.add(option.value)
                        }
                        field.onChange([...next])
                      }}
                    />
                    <span
                      className={cn(
                        "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-grey bg-white",
                        checked && "border-primary bg-primary text-primary-foreground"
                      )}
                      aria-hidden
                    >
                      {checked ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-small-1 font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="text-small-2 text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </div>
            {options.length === 0 ? (
              <p className="text-small-1 text-muted-foreground">{t("picker.no_permissions")}</p>
            ) : null}
            {fieldState.error?.message ? (
              <FieldError>{fieldState.error.message}</FieldError>
            ) : null}
          </fieldset>
        )
      }}
    />
  )
}
