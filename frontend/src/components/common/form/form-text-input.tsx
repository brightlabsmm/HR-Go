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
import { Input } from "@/components/ui/input"

interface FormTextInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  type?: "text" | "email" | "tel" | "url" | "search" | "date" | "time" | "datetime-local" | "number"
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  maxLength?: number
}

export function FormTextInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  reserveErrorSpace = false,
  type = "text",
  placeholder = label,
  autoComplete,
  autoFocus = false,
  maxLength,
}: FormTextInputProps<TFieldValues>) {
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
          reserveErrorSpace={reserveErrorSpace}
          className={className}
        >
          <Input
            id={inputId}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
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
