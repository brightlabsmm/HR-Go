import { useId } from "react"
import {
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import {
  FormFieldShell,
  type FormFieldControlProps,
} from "@/components/common/form/form-field"
import { Textarea } from "@/components/ui/textarea"

interface FormTextareaInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  placeholder?: string
  rows?: number
  maxLength?: number
}

export function FormTextareaInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  placeholder = label,
  rows = 4,
  maxLength,
}: FormTextareaInputProps<TFieldValues>) {
  const inputId = useId()

  return (
    <Controller
      control={control}
      name={name as FieldPath<TFieldValues>}
      render={({ field, fieldState }) => (
        <FormFieldShell
          label={label}
          htmlFor={inputId}
          description={description}
          error={fieldState.error?.message}
          invalid={fieldState.invalid}
          required={required}
          className={className}
        >
          <Textarea
            id={inputId}
            rows={rows}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            {...field}
          />
        </FormFieldShell>
      )}
    />
  )
}
