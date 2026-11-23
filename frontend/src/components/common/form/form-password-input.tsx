import { useId, useState } from "react"
import { EyeClosed, EyeIcon, WandSparklesIcon } from "lucide-react"
import {
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  FormFieldShell,
  type FormFieldControlProps,
} from "@/components/common/form/form-field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { generateTemporaryPassword } from "@/util/password"

interface FormPasswordInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  placeholder?: string
  autoComplete?: string
  revealable?: boolean
  generatable?: boolean
}

export function FormPasswordInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  className,
  reserveErrorSpace = false,
  placeholder = label,
  autoComplete = "current-password",
  revealable = true,
  generatable = false,
}: FormPasswordInputProps<TFieldValues>) {
  const inputId = useId()
  const { t } = useTranslation("common")
  const [isVisible, setIsVisible] = useState(false)
  const toggleLabel = isVisible
    ? t("form.hide_password")
    : t("form.show_password")
  const generateLabel = t("form.generate_password")
  const showAddon = revealable || generatable

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
          reserveErrorSpace={reserveErrorSpace}
          className={className}
        >
          <InputGroup>
            <InputGroupInput
              id={inputId}
              type={isVisible ? "text" : "password"}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              {...field}
            />
            {showAddon ? (
              <InputGroupAddon align="inline-end" className="gap-1 pr-2">
                {generatable ? (
                  <InputGroupButton
                    size="sm"
                    aria-label={generateLabel}
                    disabled={disabled}
                    className="px-2 text-small-1"
                    onClick={() => {
                      field.onChange(generateTemporaryPassword())
                      setIsVisible(true)
                    }}
                  >
                    <WandSparklesIcon />
                    {generateLabel}
                  </InputGroupButton>
                ) : null}
                {revealable ? (
                  <InputGroupButton
                    aria-label={toggleLabel}
                    disabled={disabled}
                    onClick={() => setIsVisible((visible) => !visible)}
                  >
                    {isVisible ? <EyeIcon /> : <EyeClosed />}
                  </InputGroupButton>
                ) : null}
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </FormFieldShell>
      )}
    />
  )
}
