import { useId } from "react"
import {
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  FormFieldShell,
  type FormFieldControlProps,
  type FormFieldOption,
} from "@/components/common/form/form-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FormSelectInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  options: FormFieldOption[]
  placeholder?: string
}

export function FormSelectInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  options,
  placeholder,
}: FormSelectInputProps<TFieldValues>) {
  const triggerId = useId()
  const { t } = useTranslation("common")
  const selectPlaceholder = placeholder ?? t("form.select_placeholder")

  return (
    <Controller
      control={control}
      name={name as FieldPath<TFieldValues>}
      render={({ field, fieldState }) => (
        <FormFieldShell
          label={label}
          htmlFor={triggerId}
          description={description}
          error={fieldState.error?.message}
          invalid={fieldState.invalid}
          required={required}
          className={className}
        >
          <Select
            items={options}
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
            disabled={disabled}
          >
            <SelectTrigger
              id={triggerId}
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldShell>
      )}
    />
  )
}
