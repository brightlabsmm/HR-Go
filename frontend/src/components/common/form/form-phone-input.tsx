import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import {
  FormFieldShell,
  type FormFieldControlProps,
} from "@/components/common/form/form-field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  digitsOnly,
  splitPhone,
  toE164Phone,
  type PhoneDialCode,
} from "@/util/phone"

const FALLBACK_DIAL_CODES: PhoneDialCode[] = [
  { phoneCode: "+95", isoCode: "MM", name: "Myanmar" },
  { phoneCode: "+66", isoCode: "TH", name: "Thailand" },
  { phoneCode: "+86", isoCode: "CN", name: "China" },
]

interface FormPhoneInputProps<TFieldValues extends FieldValues>
  extends FormFieldControlProps<TFieldValues> {
  placeholder?: string
}

function preferredPhoneCode(dialCodes: PhoneDialCode[]) {
  return (
    dialCodes.find((code) => code.isoCode === "MM")?.phoneCode ??
    dialCodes[0]?.phoneCode ??
    "+95"
  )
}

interface PhoneNumberControlProps {
  id: string
  value: string
  disabled?: boolean
  invalid?: boolean
  placeholder: string
  countryCodeLabel: string
  onBlur: () => void
  onChange: (value: string) => void
}

function PhoneNumberControl({
  id,
  value,
  disabled = false,
  invalid = false,
  placeholder,
  countryCodeLabel,
  onBlur,
  onChange,
}: PhoneNumberControlProps) {
  const dialCodes = FALLBACK_DIAL_CODES
  const defaultPhoneCode = preferredPhoneCode(dialCodes)
  const phoneCodes = useMemo(
    () => dialCodes.map((code) => code.phoneCode),
    [dialCodes]
  )
  const codeOptions = useMemo(
    () =>
      dialCodes.map((code) => ({
        value: code.phoneCode,
        label: `${code.phoneCode} ${code.name}`,
      })),
    [dialCodes]
  )
  const parsed = splitPhone(value, phoneCodes, defaultPhoneCode)
  const [phoneCode, setPhoneCode] = useState(parsed.phoneCode)
  const [national, setNational] = useState(parsed.national)
  const hasPickedCode = useRef(false)
  const selected =
    dialCodes.find((code) => code.phoneCode === phoneCode) ?? dialCodes[0]

  useEffect(() => {
    const current = national ? (toE164Phone(national, phoneCode) ?? "") : ""
    if ((value || "") === current) {
      return
    }

    const next = splitPhone(value, phoneCodes, defaultPhoneCode)
    setPhoneCode(next.phoneCode)
    setNational(next.national)
    // Keep local digits (including a leading 0) while the composed E.164 value is unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from the form value, not from typing
  }, [defaultPhoneCode, phoneCodes, value])

  useEffect(() => {
    if (hasPickedCode.current || national !== "" || phoneCode === defaultPhoneCode) {
      return
    }

    setPhoneCode(defaultPhoneCode)
  }, [defaultPhoneCode, national, phoneCode])

  function emit(nextCode: string, nextNational: string) {
    setPhoneCode(nextCode)
    setNational(nextNational)
    onChange(nextNational ? (toE164Phone(nextNational, nextCode) ?? "") : "")
  }

  function handleNationalChange(raw: string) {
    const compact = raw.trim().replace(/[\s()-]/g, "")
    if (compact.startsWith("+")) {
      const next = splitPhone(compact, phoneCodes, phoneCode)
      emit(next.phoneCode, next.national)
      return
    }

    emit(phoneCode, digitsOnly(raw))
  }

  return (
    <div
      className={cn(
        "flex h-input w-full min-w-0 items-stretch overflow-hidden rounded-input border border-input bg-surface transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid &&
          "border-destructive ring-3 ring-destructive/20 dark:ring-destructive/40",
        disabled && "pointer-events-none bg-input/50 opacity-50"
      )}
    >
      <Select
        items={codeOptions}
        value={phoneCode}
        disabled={disabled}
        modal={false}
        onValueChange={(next) => {
          if (!next) {
            return
          }

          hasPickedCode.current = true
          emit(next, national)
        }}
      >
        <SelectTrigger
          aria-label={countryCodeLabel}
          disabled={disabled}
          className="h-auto min-h-0 w-auto min-w-[5.75rem] shrink-0 self-stretch rounded-none border-0 border-r-2 border-secondary bg-transparent px-3 shadow-none focus-visible:ring-0 data-[size=default]:h-auto data-popup-open:border-r-2 data-popup-open:border-secondary"
        >
          <SelectValue>{selected?.phoneCode}</SelectValue>
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="z-[100] min-w-56"
        >
          {dialCodes.map((code) => (
            <SelectItem key={code.phoneCode} value={code.phoneCode}>
              <span className="flex items-center gap-2">
                <span>{code.phoneCode}</span>
                <span className="text-muted-foreground">{code.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        value={national}
        className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent"
        onBlur={onBlur}
        onChange={(event) => handleNationalChange(event.target.value)}
      />
    </div>
  )
}

export function FormPhoneInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className,
  placeholder,
}: FormPhoneInputProps<TFieldValues>) {
  const inputId = useId()
  const { t } = useTranslation("common")
  const numberPlaceholder = placeholder ?? t("form.phone_placeholder")

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
          <PhoneNumberControl
            id={inputId}
            value={field.value ?? ""}
            disabled={disabled}
            invalid={fieldState.invalid}
            placeholder={numberPlaceholder}
            countryCodeLabel={t("form.phone_code")}
            onBlur={field.onBlur}
            onChange={field.onChange}
          />
        </FormFieldShell>
      )}
    />
  )
}
