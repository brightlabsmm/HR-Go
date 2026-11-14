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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

interface FormComboBoxInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  options: FormFieldOption[]
  placeholder?: string
  emptyMessage?: string
}

export function FormComboBoxInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  className,
  options,
  placeholder,
  emptyMessage,
}: FormComboBoxInputProps<TFieldValues>) {
  const inputId = useId()
  const { t } = useTranslation("common")
  const searchPlaceholder = placeholder ?? t("form.search_placeholder")
  const noResults = emptyMessage ?? t("form.no_results")

  return (
    <Controller
      control={control}
      name={name as FieldPath<TFieldValues>}
      render={({ field, fieldState }) => {
        const selected =
          options.find((option) => option.value === field.value) ?? null

        return (
          <FormFieldShell
            label={label}
            htmlFor={inputId}
            description={description}
            error={fieldState.error?.message}
            invalid={fieldState.invalid}
            className={className}
          >
            <Combobox
              items={options}
              value={selected}
              onValueChange={(option) => field.onChange(option?.value ?? "")}
              isItemEqualToValue={(left, right) => left.value === right.value}
              disabled={disabled}
            >
              <ComboboxInput
                id={inputId}
                placeholder={searchPlaceholder}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              <ComboboxContent>
                <ComboboxEmpty>{noResults}</ComboboxEmpty>
                <ComboboxList>
                  {(option: FormFieldOption) => (
                    <ComboboxItem
                      key={option.value}
                      value={option}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </FormFieldShell>
        )
      }}
    />
  )
}
