import {
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import {
  FormFieldShell,
  type FormFieldControlProps,
  type FormFieldOption,
} from "@/components/common/form/form-field"

interface FormCheckboxGroupInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  options: FormFieldOption[]
}

export function FormCheckboxGroupInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  options,
}: FormCheckboxGroupInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name as FieldPath<TFieldValues>}
      render={({ field, fieldState }) => {
        const selected = Array.isArray(field.value)
          ? (field.value as string[])
          : []

        return (
          <FormFieldShell
            label={label}
            description={description}
            error={fieldState.error?.message}
            invalid={fieldState.invalid}
            required={required}
            className={className}
          >
            <div className="flex flex-col gap-2">
              {options.map((option) => {
                const isChecked = selected.includes(option.value)
                const isDisabled = disabled || option.disabled

                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-body-2 text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => {
                        if (isChecked) {
                          field.onChange(
                            selected.filter((value) => value !== option.value)
                          )
                          return
                        }

                        field.onChange([...selected, option.value])
                      }}
                    />
                    {option.label}
                  </label>
                )
              })}
            </div>
          </FormFieldShell>
        )
      }}
    />
  )
}
