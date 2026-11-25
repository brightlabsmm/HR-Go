import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import { FieldError } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
  required?: boolean
}

export function RolePicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled = false,
  required = false,
}: RolePickerProps<TFieldValues>) {
  const { t } = useTranslation("roles")

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <fieldset className="flex flex-col gap-3" disabled={disabled}>
          <legend className="mb-3 text-small-1 font-medium text-foreground">
            {label}
            {required ? (
              <span className="ml-1 text-destructive" aria-hidden>
                *
              </span>
            ) : null}
          </legend>
          <RadioGroup
            value={typeof field.value === "string" ? field.value : ""}
            onValueChange={(value) => field.onChange(value ?? "")}
            disabled={disabled}
            className="grid gap-2.5 md:grid-cols-2"
          >
            {options.map((option) => {
              const checked = field.value === option.value
              const isDisabled = disabled || option.disabled
              const optionId = `${name}-${option.value}`

              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[10px] border border-border bg-surface px-4 py-3.5",
                    checked && "border-primary bg-accent",
                    isDisabled && "cursor-not-allowed opacity-55"
                  )}
                >
                  <RadioGroupItem
                    id={optionId}
                    value={option.value}
                    disabled={isDisabled}
                    className="mt-0.5"
                    aria-invalid={fieldState.invalid}
                  />
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
          </RadioGroup>
          {options.length === 0 ? (
            <p className="text-small-1 text-muted-foreground">{t("picker.no_permissions")}</p>
          ) : null}
          {fieldState.error?.message ? (
            <FieldError>{fieldState.error.message}</FieldError>
          ) : null}
        </fieldset>
      )}
    />
  )
}
