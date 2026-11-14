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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { stripCodePrefix } from "@/util/code-prefix"

interface FormCodeInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  prefix: string
  placeholder?: string
  autoComplete?: string
}

export function FormCodeInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  prefix,
  placeholder,
  autoComplete,
}: FormCodeInputProps<TFieldValues>) {
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
          <InputGroup>
            <InputGroupAddon className="pr-2 font-mono text-small-1 text-muted-foreground">
              {prefix}
            </InputGroupAddon>
            <InputGroupInput
              id={inputId}
              type="text"
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              ref={field.ref}
              name={field.name}
              value={stripCodePrefix(prefix, String(field.value ?? ""))}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(stripCodePrefix(prefix, event.target.value))
              }}
            />
          </InputGroup>
        </FormFieldShell>
      )}
    />
  )
}
