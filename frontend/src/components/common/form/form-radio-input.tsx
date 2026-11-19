import { useId } from "react"
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
import { FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface FormRadioInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  options: FormFieldOption[]
  layout?: "vertical" | "horizontal"
}

export function FormRadioInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  className,
  options,
  layout = "vertical",
}: FormRadioInputProps<TFieldValues>) {
  const groupId = useId()

  return (
    <Controller
      control={control}
      name={name as FieldPath<TFieldValues>}
      render={({ field, fieldState }) => (
        <FormFieldShell
          label={label}
          htmlFor={groupId}
          description={description}
          error={fieldState.error?.message}
          invalid={fieldState.invalid}
          className={className}
        >
          <RadioGroup
            id={groupId}
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
            className={
              layout === "horizontal"
                ? "grid-flow-col auto-cols-max gap-4"
                : undefined
            }
          >
            {options.map((option) => {
              const optionId = `${groupId}-${option.value}`

              return (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    id={optionId}
                    value={option.value}
                    disabled={option.disabled || disabled}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel
                    htmlFor={optionId}
                    className="h-6 text-body-2 font-normal"
                  >
                    {option.label}
                  </FieldLabel>
                </div>
              )
            })}
          </RadioGroup>
        </FormFieldShell>
      )}
    />
  )
}
