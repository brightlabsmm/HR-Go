import { useId } from "react"
import {
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { type FormFieldControlProps } from "@/components/common/form/form-field"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function FormSwitchInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  className,
}: FormFieldControlProps<TFieldValues>) {
  const switchId = useId()

  return (
    <Controller
      control={control}
      name={name as FieldPath<TFieldValues>}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <div className="flex items-center gap-2">
            <FieldLabel htmlFor={switchId}>{label}</FieldLabel>
            <Switch
              id={switchId}
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
            />
          </div>
          {description ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
          {fieldState.error?.message ? (
            <FieldError>{fieldState.error.message}</FieldError>
          ) : null}
        </Field>
      )}
    />
  )
}
